import React from 'react';

import { OptionsPaneCategory } from 'app/features/dashboard/components/PanelEditor/OptionsPaneCategory';

import { SceneLayoutState, SceneObject } from '../core/types';

export interface Props {
  model: SceneObject;
}

export function SceneObjectEditor({ model }: Props) {
  return (
    <>
      <OptionsPaneCategory id="props" title="Properties" forceOpen={1}>
        <model.Editor model={model} key={model.state.key} />
      </OptionsPaneCategory>
      <OptionsPaneCategory id="layout" title="layout" forceOpen={1}>
        <pre>{JSON.stringify(serializeState(model), null, 2)}</pre>
      </OptionsPaneCategory>
    </>
  );
}

function serializeState(obj: SceneObject<SceneLayoutState>) {
  const { size } = obj.state;

  return {
    size,
    children: obj.state.children ? obj.state.children.map(serializeState) : [],
  };
}
