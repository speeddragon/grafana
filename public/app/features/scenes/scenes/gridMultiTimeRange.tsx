import { dateTime, getDefaultTimeRange } from '@grafana/data';

import { Scene } from '../components/Scene';
import { SceneTimePicker } from '../components/SceneTimePicker';
import { VizPanel } from '../components/VizPanel';
import { SceneGridLayout, SceneGridRow } from '../components/layout/SceneGridLayout';
import { SceneTimeRange } from '../core/SceneTimeRange';
import { SceneEditManager } from '../editor/SceneEditManager';

import { getQueryRunnerWithRandomWalkQuery } from './queries';

export function getGridWithMultipleTimeRanges(): Scene {
  const globalTimeRange = new SceneTimeRange(getDefaultTimeRange());

  const now = dateTime();
  const row1TimeRange = new SceneTimeRange({
    from: dateTime(now).subtract(1, 'year'),
    to: now,
    raw: { from: 'now-1y', to: 'now' },
  });

  const scene = new Scene({
    title: 'Grid with rows and different queries and time ranges',
    layout: new SceneGridLayout({
      children: [
        new SceneGridRow({
          $timeRange: row1TimeRange,
          $data: getQueryRunnerWithRandomWalkQuery({ scenarioId: 'random_walk_table' }),
          title: 'Row A - has its own query, last year time range',
          key: 'Row A',
          isCollapsed: true,
          size: { y: 0 },
          children: [
            new VizPanel({
              pluginId: 'timeseries',
              title: 'Row A Child1',
              key: 'Row A Child1',
              isResizable: true,
              isDraggable: true,
              size: { x: 0, y: 1, width: 12, height: 5 },
            }),
            new VizPanel({
              pluginId: 'timeseries',
              title: 'Row A Child2',
              key: 'Row A Child2',
              isResizable: true,
              isDraggable: true,
              size: { x: 0, y: 5, width: 6, height: 5 },
            }),
          ],
        }),

        new VizPanel({
          $data: getQueryRunnerWithRandomWalkQuery(),
          isResizable: true,
          isDraggable: true,
          pluginId: 'timeseries',
          title: 'Outsider, has its own query',
          key: 'Outsider-own-query',
          size: {
            x: 0,
            y: 12,
            width: 6,
            height: 10,
          },
        }),
      ],
    }),
    $editor: new SceneEditManager({}),
    $timeRange: globalTimeRange,
    $data: getQueryRunnerWithRandomWalkQuery(),
    actions: [new SceneTimePicker({})],
  });

  return scene;
}
