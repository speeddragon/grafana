import { css } from '@emotion/css';
import classNames from 'classnames';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { Field, Icon, InputControl, Label, LoadingPlaceholder, Tooltip, useStyles2 } from '@grafana/ui';
import { FolderPickerFilter } from 'app/core/components/Select/FolderPicker';
import { contextSrv } from 'app/core/core';
import { DashboardSearchHit } from 'app/features/search/types';
import { AccessControlAction, useDispatch } from 'app/types';
import { RulerRuleDTO, RulerRuleGroupDTO, RulerRulesConfigDTO } from 'app/types/unified-alerting-dto';

import { useUnifiedAlertingSelector } from '../../hooks/useUnifiedAlertingSelector';
import { fetchRulerRulesIfNotFetchedYet } from '../../state/actions';
import { RuleForm, RuleFormValues } from '../../types/rule-form';
import { GRAFANA_RULES_SOURCE_NAME } from '../../utils/datasource';

import { getIntervalForGroup } from './GrafanaEvaluationBehavior';
import { containsSlashes, Folder, RuleFolderPicker } from './RuleFolderPicker';
import { SelectWithAdd } from './SelectWIthAdd';
import { checkForPathSeparator } from './util';

const useGetGroups = (groupfoldersForGrafana: RulerRulesConfigDTO | null | undefined, folderName: string) => {
  const groupOptions = useMemo(() => {
    const groupsForFolderResult: Array<RulerRuleGroupDTO<RulerRuleDTO>> = groupfoldersForGrafana
      ? groupfoldersForGrafana[folderName] ?? []
      : [];
    return groupsForFolderResult.map((group) => group.name);
  }, [groupfoldersForGrafana, folderName]);

  return groupOptions;
};

function mapGroupsToOptions(groups: string[]): Array<SelectableValue<string>> {
  return groups.map((group) => ({ label: group, value: group }));
}
interface FolderAndGroupProps {
  initialFolder: RuleForm | null;
}

const useGetGroupOptionsFromFolder = (folderTilte: string) => {
  const rulerRuleRequests = useUnifiedAlertingSelector((state) => state.rulerRules);

  const groupfoldersForGrafana = rulerRuleRequests[GRAFANA_RULES_SOURCE_NAME];

  const groupOptions: Array<SelectableValue<string>> = mapGroupsToOptions(
    useGetGroups(groupfoldersForGrafana?.result, folderTilte)
  );
  const groupsForFolder = groupfoldersForGrafana?.result;
  return { groupOptions, groupsForFolder, loading: groupfoldersForGrafana?.loading };
};

const useRuleFolderFilter = (existingRuleForm: RuleForm | null) => {
  const isSearchHitAvailable = useCallback(
    (hit: DashboardSearchHit) => {
      const rbacDisabledFallback = contextSrv.hasEditPermissionInFolders;

      const canCreateRuleInFolder = contextSrv.hasAccessInMetadata(
        AccessControlAction.AlertingRuleCreate,
        hit,
        rbacDisabledFallback
      );

      const canUpdateInCurrentFolder =
        existingRuleForm &&
        hit.folderId === existingRuleForm.id &&
        contextSrv.hasAccessInMetadata(AccessControlAction.AlertingRuleUpdate, hit, rbacDisabledFallback);
      return canCreateRuleInFolder || canUpdateInCurrentFolder;
    },
    [existingRuleForm]
  );

  return useCallback<FolderPickerFilter>(
    (folderHits) =>
      folderHits
        .filter(isSearchHitAvailable)
        .filter((value: DashboardSearchHit) => !containsSlashes(value.title ?? '')),
    [isSearchHitAvailable]
  );
};
function InfoIcon({ text }: { text: string }) {
  return (
    <Tooltip placement="top" content={<div>{text}</div>}>
      <Icon name="info-circle" size="xs" />
    </Tooltip>
  );
}

export function FolderAndGroup({ initialFolder }: FolderAndGroupProps) {
  const {
    formState: { errors },
    watch,
    control,
  } = useFormContext<RuleFormValues>();

  const styles = useStyles2(getStyles);
  const folderFilter = useRuleFolderFilter(initialFolder);
  const dispatch = useDispatch();
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  const folder = watch('folder');
  const group = watch('group');
  const [selectedGroup, setSelectedGroup] = useState(group);
  const initialRender = useRef(true);

  const { groupOptions, groupsForFolder, loading } = useGetGroupOptionsFromFolder(folder?.title ?? '');

  useEffect(() => {
    dispatch(fetchRulerRulesIfNotFetchedYet(GRAFANA_RULES_SOURCE_NAME));
  }, [dispatch]);

  const resetGroup = useCallback(() => {
    if (group && !initialRender.current && folder?.title) {
      setSelectedGroup('');
    }
    initialRender.current = false;
  }, [initialRender, folder, setSelectedGroup, group]);

  const groupIsInGroupOptions = useCallback(
    (group_: string) => {
      return groupOptions.includes((groupInList: SelectableValue<string>) => groupInList.label === group_);
    },
    [groupOptions]
  );
  const folderTilte = folder?.title ?? '';

  useEffect(() => {
    if (folderTilte && groupOptions && !groupIsInGroupOptions(selectedGroup)) {
      setIsAddingGroup(false);
      resetGroup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderTilte]);

  return (
    <div className={classNames([styles.flexRow, styles.alignBaseline])}>
      <Field
        label={
          <Label htmlFor="folder" description={'Select a folder to store your rule.'}>
            <Stack gap={0.5}>
              Folder
              <InfoIcon
                text={
                  'Each folder has unique folder permission. When you store multiple rules in a folder, the folder access permissions get assigned to the rules.'
                }
              />
            </Stack>
          </Label>
        }
        className={styles.formInput}
        error={errors.folder?.message}
        invalid={!!errors.folder?.message}
        data-testid="folder-picker"
      >
        <InputControl
          render={({ field: { ref, ...field } }) => (
            <RuleFolderPicker
              inputId="folder"
              {...field}
              enableCreateNew={contextSrv.hasPermission(AccessControlAction.FoldersCreate)}
              enableReset={true}
              filter={folderFilter}
              dissalowSlashes={true}
            />
          )}
          name="folder"
          rules={{
            required: { value: true, message: 'Please select a folder' },
            validate: {
              pathSeparator: (folder: Folder) => checkForPathSeparator(folder.title),
            },
          }}
        />
      </Field>

      <Field
        label="Group (evaluation interval)"
        data-testid="group-picker"
        description="Rules within the same group are evaluated after the same time interval."
        className={styles.formInput}
        error={errors.group?.message}
        invalid={!!errors.group?.message}
      >
        <InputControl
          render={({ field: { ref, ...field } }) =>
            loading ? (
              <LoadingPlaceholder text="Loading..." />
            ) : (
              <SelectWithAdd
                {...field}
                options={groupOptions}
                getOptionLabel={(option: SelectableValue<string>) =>
                  `${option.label}  (${getIntervalForGroup(groupsForFolder, option.label ?? '', folder?.title ?? '')})`
                }
                width={42}
                value={selectedGroup}
                custom={isAddingGroup}
                onCustomChange={(custom: boolean) => setIsAddingGroup(custom)}
                onChange={(value: string) => {
                  field.onChange(value);
                  setSelectedGroup(value);
                }}
              />
            )
          }
          name="group"
          control={control}
          rules={{
            required: { value: true, message: 'Must enter a group name' },
          }}
        />
      </Field>
    </div>
  );
}
const getStyles = (theme: GrafanaTheme2) => ({
  flexRow: css`
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
  `,
  alignBaseline: css`
    align-items: baseline;
    margin-bottom: ${theme.spacing(1)};
  `,
  formInput: css`
    width: 275px;

    & + & {
      margin-left: ${theme.spacing(3)};
    }
  `,
});
