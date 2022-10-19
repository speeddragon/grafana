import { getDefaultTimeRange } from '@grafana/data';

import { Scene } from '../components/Scene';
import { SceneTimePicker } from '../components/SceneTimePicker';
import { VizPanel } from '../components/VizPanel';
import { SceneTimeRange } from '../core/SceneTimeRange';
import { SceneEditManager } from '../editor/SceneEditManager';
import { SceneQueryRunner } from '../querying/SceneQueryRunner';
import { SceneGridstackLayout, SceneGridRow } from '../components/layout/SceneGridstackLayout';

export function getGridNestedTest(): Scene {
  const row = new SceneGridRow({
    title: 'Nested grid layout',
    size: { x: 0, y: 0, height: 11 },
    children: [
      new SceneGridstackLayout({
        children: [
          new VizPanel({
            size: { x: 0, y: 0, width: 6, height: 10 },
            isDraggable: true,
            pluginId: 'timeseries',
            title: 'Test Panel',
          }),
          new VizPanel({
            size: { x: 6, y: 0, width: 6, height: 5 },
            isDraggable: true,
            pluginId: 'timeseries',
            title: 'Test Panel',
          }),
          new VizPanel({
            isDraggable: true,
            size: { x: 6, y: 5, width: 6, height: 5 },
            pluginId: 'timeseries',
            title: 'Test Panel',
          }),
        ],
      }),
    ],
  });

  const cell1 = new VizPanel({
    size: {
      x: 0,
      y: 11,
      width: 6,
      height: 10,
    },
    isDraggable: true,
    pluginId: 'timeseries',
    title: 'Cell 1',
  });

  const cell2 = new VizPanel({
    size: {
      x: 6,
      y: 11,
      width: 6,
      height: 10,
    },
    isDraggable: true,
    pluginId: 'timeseries',
    title: 'Cell 2',
  });

  const scene = new Scene({
    title: 'Grid nested test',
    layout: new SceneGridstackLayout({
      children: [
        row,
        new SceneGridstackLayout({
          size: {
            x: 0,
            y: 0,
            width: 12,
            height: 10,
          },
          children: [cell1, cell2],
        }),
      ],
    }),
    $editor: new SceneEditManager({}),
    $timeRange: new SceneTimeRange(getDefaultTimeRange()),
    $data: new SceneQueryRunner({
      queries: [
        {
          refId: 'A',
          datasource: {
            uid: 'gdev-testdata',
            type: 'testdata',
          },
          scenarioId: 'random_walk',
        },
      ],
    }),
    actions: [new SceneTimePicker({})],
  });

  return scene;
}
