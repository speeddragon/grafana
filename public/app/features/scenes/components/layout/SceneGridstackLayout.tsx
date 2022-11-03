import { css, cx } from '@emotion/css';
import React, { createRef, useLayoutEffect, useRef } from 'react';
import { GridItemHTMLElement, GridStack, GridStackEventHandlerCallback, GridStackNode } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';

import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import { DEFAULT_ROW_HEIGHT, GRID_CELL_HEIGHT, GRID_CELL_VMARGIN, GRID_COLUMN_COUNT } from 'app/core/constants';

import { SceneObjectBase, sceneObjectsMap } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneLayoutChildState, SceneLayoutState, SceneObject } from '../../core/types';
import { SceneDragHandle } from '../SceneDragHandle';

interface SceneGridLayoutState extends SceneLayoutState {
  draggingItem: SceneObject;
}

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
    /**
     * This forces a re-render through updating the state
     */
    this.setState({
      children: [...this.state.children],
    });
  }

  getElementSize(el: GridItemHTMLElement) {
    // return {
    //   w: parseInt(el.getAttribute('gs-w') || '0', 10),
    //   h: parseInt(el.getAttribute('gs-h') || '0', 10),
    //   x: parseInt(el.getAttribute('gs-x') || '0', 10),
    //   y: parseInt(el.getAttribute('gs-y') || '0', 10),
    // };
  }

  getElementKey(el: GridItemHTMLElement) {
    if (!el || (!el.getAttribute && typeof el === 'string')) {
      return null;
    }

    return el.getAttribute('gs-id');
  }

  onResizeStop: GridStackEventHandlerCallback = (event, el) => {
    // const child = this.state.children.find((c) => c.state.key === this.getElementKey(el));
    // if (!child) {
    //   return;
    // }
    // const newSize = this.getElementSize(el);
    // child.setState({
    //   size: {
    //     ...child.state.size,
    //     width: newSize.w,
    //     height: newSize.h,
    //   },
    // });
  };

  onDragStart: GridStackEventHandlerCallback = (event, el) => {
    // Update children positions if they have changed
    const child = this.state.children.find((c) => c.state.key === this.getElementKey(el));
    if (!child) {
      return;
    }

    this.setState({
      children: this.state.children.filter((c) => c.state.key !== child.state.key),
    });
    // this.getRoot().events.publish(new GridLayoutDragStartEvent({ sceneObject: child }));
  };

  onDragStop: GridStackEventHandlerCallback = (event, el, newEl) => {
    // Update children positions if they have changed
    // const child = this.state.children.find((c) => c.state.key === this.getElementKey(el));
    // if (!child) {
    //   return;
    // }
    // const childSize = child.state.size;
    // const childLayout = this.getElementSize(el);
    // if (
    //   childSize?.x !== childLayout.x ||
    //   childSize?.y !== childLayout.y ||
    //   childSize?.width !== childLayout.w ||
    //   childSize?.height !== childLayout.h
    // ) {
    //   child.setState({
    //     size: {
    //       ...child.state.size,
    //       x: childLayout.x,
    //       y: childLayout.y,
    //     },
    //   });
    // }
  };

  onDrop = (event: Event, previousEl: GridStackNode, newEl: GridStackNode) => {
    console.log('onDrop', this.state.key);
    // Remove element if previous was on this grid
    // const newChild = this.state.draggingItem;
    // this.getRoot().events.publish(new GridLayoutDropEvent({ sceneObject: newChild }));
    // this.setState({ children: [...this.state.children, newChild] });
  };

  onAdded: GridStackEventHandlerCallback = (event, previousEl) => {};

  onRemoveItem: GridStackEventHandlerCallback = (event, previousEl) => {
    console.log('removed', event);
    // if (!previousEl) {
    //   return;
    // }
    // const elId = Array.isArray(previousEl) ? previousEl[0].id : previousEl.id;
    // if (elId === undefined) {
    //   return;
    // }
    // const [layoutId, childId] = elId.toString().split(':');
    // // const childId = elId.toString().split(':')[1];
    // // Remove dragging item if previous was on this grid
    // const previousChild = this.state.children.find((c) => c.state.key === childId);
    // if (previousChild && layoutId === this.state.key!) {
    //   const next = this.state.children.filter((child) => child.state.key !== previousChild.state.key);
    //   console.log('onRemoveItem', this.state.key, childId, this.state.children, next);
    //   this.setState({
    //     children: next,
    //   });
    //   return;
    // }
  };

  onDropped: (g: GridStack) => GridStackEventHandlerCallback = (g) => (event, p, n) => {
    console.log(g.getGridItems());
    if (!n || !n.id) {
      return;
    }
    const [layoutId, childId] = n.id.toString().split(':');
    const layoutObject = sceneObjectsMap.get(layoutId);
    const childObject = sceneObjectsMap.get(childId);

    // Gridstack creates a DOM element for dropped items, those need to be removed
    // as they are rendered by React
    g.getGridItems().forEach((item) => {
      const layoutId = item.getAttribute('gs-id')?.split(':')[0];
      if (layoutId !== this.state.key) {
        g.removeWidget(item);
      }
    });

    layoutObject?.setState({
      children: layoutObject.state.children.filter((child) => child.state.key !== childId),
    });

    childObject?.setState({
      size: {
        ...childObject.state.size,
        x: n.x,
        y: n.y,
      },
    });

    // console.log('onDropped', p, childObject?.state.size, n);

    this.setState({
      children: [...this.state.children, childObject],
    });

    // console.log('onDropped', this.state.key);
    // console.log('layout');
    // console.log('child', sceneObjectsMap.get(childId));
  };
}

function SceneGridLayoutRenderer({ model }: SceneComponentProps<SceneGridstackLayout>) {
  const { children } = model.useState();
  const refs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});
  const gridRef = useRef<GridStack | null>(null);

  if (Object.keys(refs.current).length !== children.length) {
    children.forEach(({ state }) => {
      refs.current[state.key!] = refs.current[state.key!] || createRef();
    });
  }

  useLayoutEffect(() => {
    gridRef.current = GridStack.init(
      {
        // TODO: Use 24 cols
        column: 12,
        cellHeight: GRID_CELL_HEIGHT,
        cellHeightUnit: 'px',
        margin: GRID_CELL_VMARGIN / 2,
        acceptWidgets: true,
        draggable: {
          handle: '.grid-drag-handle',
          pause: true,
        },
      },
      `.grid-stack-${model.state.key}`
    );

    const grid = gridRef.current;
    grid.batchUpdate();
    grid.removeAll();

    children.forEach(({ state }) => {
      const childRef = refs.current[state.key!];
      if (childRef.current) {
        grid.makeWidget(childRef.current);
      }
    });
    grid.commit();

    grid.on('dragstop', model.onDragStop);
    grid.on('dragstart', model.onDragStart);
    grid.on('resizestop', model.onResizeStop);
    grid.on('dropped', model.onDropped(gridRef.current));
    grid.on('removed', model.onRemoveItem);
    grid.on('added', model.onAdded);

    return () => {
      if (gridRef.current) {
        // gridRef.current.destroy(false);
        // gridRef.current = null;
      }
    };
  }, [children]);

  return (
    /**
     * The children is using a width of 100% so we need to guarantee that it is wrapped
     * in an element that has the calculated size given by the AutoSizer. The AutoSizer
     * has a width of 0 and will let its content overflow its div.
     */
    <div className={`grid-stack grid-stack-${model.state.key}`} style={{ width: '100%', border: '1px solid green' }}>
      {children?.map((item, i) => {
        return (
          <>
            <div
              ref={refs.current[item.state.key!]}
              key={item.state.key}
              className="grid-stack-item"
              // id identifies the layout and layout item element for re-wiring children when moving between multiple layouts
              gs-id={`${model.state.key}:${item.state.key}`}
              gs-w={item.state.size.width}
              gs-h={item.state.size.height}
              gs-x={item.state.size.x}
              gs-y={item.state.size.y}
            >
              <div className="grid-stack-item-content" style={{ color: 'white' }}>
                <item.Component model={item} />
              </div>
            </div>
          </>
        );
      })}
    </div>
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

// function validateChildrenSize(children: SceneLayoutChild[]) {
//   if (
//     children.find(
//       (c) =>
//         !c.state.size ||
//         c.state.size.height === undefined ||
//         c.state.size.width === undefined ||
//         c.state.size.x === undefined ||
//         c.state.size.y === undefined
//     )
//   ) {
//     throw new Error('All children must have a size specified');
//   }
// }
