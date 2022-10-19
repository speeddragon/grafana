import { getDefaultTimeRange } from '@grafana/data';

import { Scene } from '../components/Scene';
import { SceneTimePicker } from '../components/SceneTimePicker';
import { VizPanel } from '../components/VizPanel';
import { SceneFlexLayout } from '../components/layout/SceneFlexLayout';
import { SceneTimeRange } from '../core/SceneTimeRange';
import { SceneEditManager } from '../editor/SceneEditManager';
import { SceneQueryRunner } from '../querying/SceneQueryRunner';
import { SceneGridstackLayout } from '../components/layout/SceneGridstackLayout';

export function getGridLayoutTest(): Scene {
  const scene = new Scene({
    title: 'Grid layout test',
    layout: new SceneGridstackLayout({
      children: [
        new VizPanel({
          isResizable: true,
          isDraggable: true,
          pluginId: 'timeseries',
          title: 'Draggable and resizable',
          size: {
            x: 0,
            y: 0,
            width: 6,
            height: 10,
          },
        }),

        new VizPanel({
          pluginId: 'timeseries',
          title: 'No drag and no resize',
          isResizable: false,
          isDraggable: false,
          size: { x: 6, y: 0, width: 6, height: 10 },
        }),

        new SceneFlexLayout({
          direction: 'column',
          isDraggable: true,
          isResizable: true,
          size: { x: 0, y: 11, width: 12, height: 10 },
          children: [
            new VizPanel({
              size: { ySizing: 'fill' },
              pluginId: 'timeseries',
              title: 'Child of flex layout',
            }),
            new VizPanel({
              size: { ySizing: 'fill' },
              pluginId: 'timeseries',
              title: 'Child of flex layout',
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
