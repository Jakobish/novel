import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface RTLSupportOptions {
  types: string[];
  autoDetect: boolean;
  defaultDirection: 'ltr' | 'rtl';
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    rtlSupport: {
      /**
       * Set text direction for the current block
       */
      setTextDirection: (direction: 'ltr' | 'rtl') => ReturnType;
      /**
       * Toggle text direction for the current block
       */
      toggleTextDirection: () => ReturnType;
      /**
       * Set document direction
       */
      setDocumentDirection: (direction: 'ltr' | 'rtl') => ReturnType;
    };
  }
}

// Hebrew and Arabic character ranges
const RTL_REGEX = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

// Function to detect if text contains RTL characters
function containsRTL(text: string): boolean {
  return RTL_REGEX.test(text);
}

// Function to get the dominant direction of a text
function getTextDirection(text: string): 'ltr' | 'rtl' {
  const rtlChars = (text.match(RTL_REGEX) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  
  // If more than 30% of characters are RTL, consider it RTL
  return rtlChars / totalChars > 0.3 ? 'rtl' : 'ltr';
}

export const RTLSupport = Extension.create<RTLSupportOptions>({
  name: 'rtlSupport',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote', 'listItem'],
      autoDetect: true,
      defaultDirection: 'ltr',
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          dir: {
            default: null,
            parseHTML: element => element.getAttribute('dir'),
            renderHTML: attributes => {
              if (!attributes.dir) {
                return {};
              }
              return { dir: attributes.dir };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextDirection:
        (direction: 'ltr' | 'rtl') =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;

          if (dispatch) {
            state.doc.nodesBetween(from, to, (node, pos) => {
              if (this.options.types.includes(node.type.name)) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  dir: direction,
                });
              }
            });
          }

          return true;
        },

      toggleTextDirection:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from } = selection;
          
          const node = state.doc.nodeAt(from);
          if (!node || !this.options.types.includes(node.type.name)) {
            return false;
          }

          const currentDir = node.attrs.dir || this.options.defaultDirection;
          const newDir = currentDir === 'rtl' ? 'ltr' : 'rtl';

          if (dispatch) {
            tr.setNodeMarkup(from, undefined, {
              ...node.attrs,
              dir: newDir,
            });
          }

          return true;
        },

      setDocumentDirection:
        (direction: 'ltr' | 'rtl') =>
        ({ tr, state, dispatch }) => {
          if (dispatch) {
            // Set direction on the document root
            const { doc } = state;
            tr.setNodeMarkup(0, undefined, {
              ...doc.attrs,
              dir: direction,
            });
          }

          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Ctrl-Shift-r': () => this.editor.commands.toggleTextDirection(),
      'Cmd-Shift-r': () => this.editor.commands.toggleTextDirection(),
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('rtlSupport'),
        
        props: {
          decorations: (state) => {
            if (!this.options.autoDetect) {
              return DecorationSet.empty;
            }

            const decorations: Decoration[] = [];
            const { doc } = state;

            doc.descendants((node, pos) => {
              if (this.options.types.includes(node.type.name) && !node.attrs.dir) {
                const text = node.textContent;
                if (text && containsRTL(text)) {
                  const direction = getTextDirection(text);
                  if (direction === 'rtl') {
                    decorations.push(
                      Decoration.node(pos, pos + node.nodeSize, {
                        class: 'rtl-auto-detected',
                        dir: 'rtl',
                      })
                    );
                  }
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },

        appendTransaction: (transactions, oldState, newState) => {
          if (!this.options.autoDetect) {
            return null;
          }

          const tr = newState.tr;
          let modified = false;

          // Check for text changes and auto-detect direction
          transactions.forEach(transaction => {
            if (transaction.docChanged) {
              // Check all changed content for RTL text
              newState.doc.descendants((node, pos) => {
                if (this.options.types.includes(node.type.name)) {
                  const text = node.textContent;
                  const currentDir = node.attrs.dir;
                  
                  if (text && containsRTL(text)) {
                    const direction = getTextDirection(text);
                    if (direction === 'rtl' && !currentDir) {
                      tr.setNodeMarkup(pos, undefined, {
                        ...node.attrs,
                        dir: 'rtl',
                      });
                      modified = true;
                    }
                  } else if (currentDir === 'rtl' && text && !containsRTL(text)) {
                    // Remove RTL if no RTL characters remain
                    tr.setNodeMarkup(pos, undefined, {
                      ...node.attrs,
                      dir: null,
                    });
                    modified = true;
                  }
                }
              });
            }
          });

          return modified ? tr : null;
        },
      }),
    ];
  },
});