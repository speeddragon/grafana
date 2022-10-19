import { css, cx } from '@emotion/css';
import React, { createRef, useEffect, useRef } from 'react';
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';

import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2, useTheme2 } from '@grafana/ui';
import { DEFAULT_ROW_HEIGHT, GRID_CELL_HEIGHT, GRID_CELL_VMARGIN, GRID_COLUMN_COUNT } from 'app/core/constants';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import {
  SceneComponentProps,
  SceneLayoutChild,
  SceneLayoutChildState,
  SceneLayoutState,
  SceneObject,
} from '../../core/types';
import { SceneDragHandle } from '../SceneDragHandle';

interface SceneGridLayoutState extends SceneLayoutState {}

type GridCellLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export class SceneGridstackLayout extends SceneObjectBase<SceneGridLayoutState> {
  static Component = SceneGridLayoutRenderer;

  constructor(state: SceneGridLayoutState) {
    super({
      isDraggable: true,
      ...state,
    });
  }

  updateLayout() {
    this.setState({
      children: [...this.state.children],
    });
  }

  onResizeStop: ReactGridLayout.ItemCallback = (_, o, n) => {
    const child = this.state.children.find((c) => c.state.key === n.i);
    if (!child) {
      return;
    }
    child.setState({
      size: {
        ...child.state.size,
        width: n.w,
        height: n.h,
      },
    });
  };

  onDragStop: ReactGridLayout.ItemCallback = (l, o, n) => {
    // Update children positions if they have changed
    for (let i = 0; i < l.length; i++) {
      const child = this.state.children[i];
      const childSize = child.state.size;
      const childLayout = l[i];
      if (
        childSize?.x !== childLayout.x ||
        childSize?.y !== childLayout.y ||
        childSize?.width !== childLayout.w ||
        childSize?.height !== childLayout.h
      ) {
        child.setState({
          size: {
            ...child.state.size,
            x: childLayout.x,
            y: childLayout.y,
          },
        });
      }
    }

    this.updateLayout();
  };
}

function SceneGridLayoutRenderer({ model }: SceneComponentProps<SceneGridLayout>) {
  const theme = useTheme2();
  const { children } = model.useState();
  const refs = useRef({});

  if (Object.keys(refs.current).length !== children.length) {
    children.forEach(({ state }) => {
      refs.current[state.key!] = refs.current[state.key!] || createRef();
    });
  }

  useEffect(() => {
    const grid = GridStack.init(
      {
        cellHeight: GRID_CELL_HEIGHT,
        cellHeightUnit: 'px',
        margin: GRID_CELL_VMARGIN / 2,
        acceptWidgets: true,
        // handleClass: `grid-drag-handle`,
        draggable: {
          handle: '.grid-drag-handle',
          pause: true,
        },
        // handle: `.grid-drag-handle`,
        // handleClass: `grid-drag-handle`,
      },
      `.grid-stack-${model.state.key}`
    );

    // grid.load(
    //   children.map((child) => {
    //     return {
    //       x: child.state.size?.x,
    //       y: child.state.size?.y,
    //       w: child.state.size?.width,
    //       h: child.state.size?.height,
    //     };
    //   })
    // );
    grid.removeAll(false);
    children.forEach(({ state }) => {
      grid.makeWidget(refs.current[state.key].current);
    });

    grid.on('dropped', (e, p, n) => {
      console.log(n);
      debugger;
    });
  }, [children]);

  // Dev only, to be removed
  // const background = generateGridBackground({
  //   cellSize: { width: (width - 23 * GRID_CELL_VMARGIN) / 24, height: GRID_CELL_HEIGHT },
  //   margin: [GRID_CELL_VMARGIN, GRID_CELL_VMARGIN],
  //   cols: 24,
  //   gridWidth: width,
  //   theme,
  // });

  return (
    /**
     * The children is using a width of 100% so we need to guarantee that it is wrapped
     * in an element that has the calculated size given by the AutoSizer. The AutoSizer
     * has a width of 0 and will let its content overflow its div.
     */
    // <div style={{ width: `${width}px`, height: '100%', background }}>
    <div className={`grid-stack grid-stack-${model.state.key}`} style={{ width: '100%' }}>
      {children?.map((item, i) => {
        return (
          <div
            ref={refs.current[item.state.key!]}
            key={item.state.key}
            className="grid-stack-item"
            gs-w={item.state.size.width}
            gs-h={item.state.size.height}
            gs-x={item.state.size.x}
            gs-y={item.state.size.y}
          >
            <div className="grid-stack-item-content" style={{ color: 'white' }}>
              <item.Component model={item} />
            </div>
          </div>
        );
      })}
    </div>
    // </div>
  );
}

interface SceneGridRowState extends SceneLayoutChildState {
  title: string;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  children: Array<SceneObject<SceneLayoutChildState>>;
}

export class SceneGridRow extends SceneObjectBase<SceneGridRowState> {
  static Component = SceneGridRowRenderer;
  private _originalHeight = 0;

  constructor(
    state: Omit<SceneGridRowState, 'size'> & { size: Pick<GridCellLayout, 'x' | 'y' | 'height'> & { width?: number } }
  ) {
    super({
      isResizable: true,
      isDraggable: true,
      isCollapsible: true,
      ...state,
      size: {
        ...state.size,
        height: state.isCollapsed ? GRID_CELL_HEIGHT : state.size?.height || DEFAULT_ROW_HEIGHT,
        width: state.size.width || GRID_COLUMN_COUNT,
      },
    });

    this._originalHeight = parseInt(
      (state.isCollapsed ? GRID_CELL_HEIGHT : state.size?.height || DEFAULT_ROW_HEIGHT).toString(),
      10
    );

    this.subs = this.subscribe({
      next: (state) => {
        // Preserve the height of the row to be able to restore it when uncollapsing
        if (
          state.size &&
          state.size.height &&
          state.size.height !== this._originalHeight &&
          state.size?.height !== GRID_CELL_HEIGHT &&
          !state.isCollapsed
        ) {
          this._originalHeight = parseInt(state.size.height?.toString(), 10);
        }
      },
    });
  }

  onCollapseToggle = () => {
    if (!this.state.isCollapsible) {
      return;
    }
    const layout = this.parent;

    if (!layout || !(layout instanceof SceneGridstackLayout)) {
      throw new Error('SceneGridRow must be a child of SceneGridLayout');
    }

    const { isCollapsed, size } = this.state;
    if (!size) {
      return;
    }

    if (layout) {
      if (isCollapsed) {
        this.setState({ isCollapsed: false, isResizable: true, size: { ...size, height: this._originalHeight } });
      } else {
        this.setState({ isCollapsed: true, isResizable: false, size: { ...size, height: 1 } });
      }
      layout.updateLayout();
    }
  };
}

function SceneGridRowRenderer({ model }: SceneComponentProps<SceneGridRow>) {
  const styles = useStyles2(getSceneGridRowStyles);
  const { isCollapsible, isCollapsed, title, ...state } = model.useState();
  const layout = model.getLayout();
  const isDraggable = layout.state.isDraggable ? state.isDraggable : false;
  const dragHandle = <SceneDragHandle layoutKey={layout.state.key!} />;

  return (
    <div className={styles.row}>
      <div className={cx(styles.rowHeader, isCollapsed && styles.rowHeaderCollapsed)}>
        <div onClick={model.onCollapseToggle} className={styles.rowTitleWrapper}>
          {isCollapsible && <Icon name={isCollapsed ? 'angle-right' : 'angle-down'} />}
          <span className={styles.rowTitle}>{title}</span>
        </div>
        {isDraggable && <div>{dragHandle}</div>}
      </div>

      {!isCollapsed && (
        <div style={{ display: 'flex', flexGrow: 1, height: 'calc(100%-30px)', width: '100%' }}>
          {model.state.children.map((child) => {
            return <child.Component key={child.state.key} model={child} />;
          })}
        </div>
      )}
    </div>
  );
}

const getSceneGridRowStyles = (theme: GrafanaTheme2) => {
  return {
    row: css({
      width: '100%',
      height: '100%',
      position: 'relative',
      zIndex: 0,
      display: 'flex',
      flexDirection: 'column',
    }),
    rowHeader: css({
      width: '100%',
      height: '30px',
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '8px',
      border: `1px solid transparent`,
    }),
    rowTitleWrapper: css({
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
    }),
    rowHeaderCollapsed: css({
      marginBottom: '0px',
      background: theme.colors.background.primary,
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.borderRadius(1),
    }),
    rowTitle: css({
      fontSize: theme.typography.h6.fontSize,
      fontWeight: theme.typography.h6.fontWeight,
    }),
  };
};

// Source: https://github.com/metabase/metabase/blob/master/frontend/src/metabase/dashboard/components/grid/utils.js#L28
// © 2022 Metabase, Inc.
export function generateGridBackground({
  cellSize,
  margin,
  cols,
  gridWidth,
  theme,
}: {
  cellSize: { width: number; height: number };
  margin: [number, number];
  cols: number;
  gridWidth: number;
  theme: GrafanaTheme2;
}) {
  const XMLNS = 'http://www.w3.org/2000/svg';
  const [horizontalMargin, verticalMargin] = margin;
  const rowHeight = cellSize.height + verticalMargin;
  const cellStrokeColor = theme.colors.border.weak;

  const y = 0;
  const w = cellSize.width;
  const h = cellSize.height;

  const rectangles = new Array(cols).fill(undefined).map((_, i) => {
    const x = i * (cellSize.width + horizontalMargin);
    return `<rect stroke='${cellStrokeColor}' stroke-width='1' fill='none' x='${x}' y='${y}' width='${w}' height='${h}'/>`;
  });

  const svg = [`<svg xmlns='${XMLNS}' width='${gridWidth}' height='${rowHeight}'>`, ...rectangles, `</svg>`].join('');

  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

function validateChildrenSize(children: SceneLayoutChild[]) {
  if (
    children.find(
      (c) =>
        !c.state.size ||
        c.state.size.height === undefined ||
        c.state.size.width === undefined ||
        c.state.size.x === undefined ||
        c.state.size.y === undefined
    )
  ) {
    throw new Error('All children must have a size specified');
  }
}
