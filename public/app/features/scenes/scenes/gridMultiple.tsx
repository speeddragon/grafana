import { getDefaultTimeRange } from '@grafana/data';

import { Scene } from '../components/Scene';
import { SceneTimePicker } from '../components/SceneTimePicker';
import { VizPanel } from '../components/VizPanel';
import { SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { SceneTimeRange } from '../core/SceneTimeRange';
import { SceneEditManager } from '../editor/SceneEditManager';
import { SceneQueryRunner } from '../querying/SceneQueryRunner';
import { SceneGridstackLayout } from '../components/layout/SceneGridstackLayout';

export function getMultipleGridLayoutTest(): Scene {
  const scene = new Scene({
    title: 'Multiple grid layouts test',
    layout: new SceneFlexLayout({
      children: [
        new SceneGridstackLayout({
          children: [
            new VizPanel({
              size: {
                x: 0,
                y: 0,
                width: 6,
                height: 10,
              },
              isDraggable: true,
              isResizable: true,
              pluginId: 'timeseries',
              title: 'Dragabble and resizable',
            }),
            new VizPanel({
              isResizable: false,
              isDraggable: true,
              size: { x: 6, y: 0, width: 6, height: 10 },
              pluginId: 'timeseries',
              title: 'Draggable only',
            }),
          ],
        }),

        new SceneGridstackLayout({
          children: [
            new VizPanel({
              size: {
                x: 0,
                y: 0,
                width: 12,
                height: 10,
              },
              isDraggable: true,
              pluginId: 'timeseries',
              title: 'Fill height',
            }),
            new VizPanel({
              isResizable: false,
              isDraggable: true,
              size: { x: 6, y: 0, width: 6, height: 10 },
              pluginId: 'timeseries',
              title: 'Fill height',
            }),
          ],
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
