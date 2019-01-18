//
// Modeled on jupyter's terminado.js, but modified a lot for Graffiti usage.
//
// xterm, xterm's css and its fit addon were downloaded and put in the graffiti code base, from here:
// "xterm.js": "https://unpkg.com/xterm@~3.1.0/dist/xterm.js"
// "xterm.js-fit": "https://unpkg.com/xterm@~3.1.0/dist/addons/fit/fit.js"
// "xterm.js-css": "https://unpkg.com/xterm@~3.1.0/dist/xterm.css"

define ([
  '/nbextensions/graffiti_extension/js/utils.js',
  '/nbextensions/graffiti_extension/js/xterm/xterm.js',
  '/nbextensions/graffiti_extension/js/xterm/addons/fit/fit.js',
], (utils, terminalLib, fit) => {
  const terminals = {

    focusedTerminal: undefined,
    terminalsList: {},

    _makeTerminal: (element, terminalId, wsUrl, sizeObj) => {
      const ws = new WebSocket(wsUrl);
      terminalLib.applyAddon(fit);
      const term = new terminalLib();
      term.id = terminalId;
      ws.onopen = function(event) {
        term.on('data', function(data) {
          ws.send(JSON.stringify(['stdin', data]));
        });

        // term.on('keydown', (data) => {
        //  console.log('keypress data:', data);
        // });
        
        term.on('scroll', (data) => {
          // console.log('term scroll:', data);
        });

        term.on('focus', () => { 
          console.log('terminal ' + term.id + ' focused');
          terminals.focusedTerminal = term;
        });
        term.on('blur', () => { 
          console.log('terminal defocused'); 
          terminals.focusedTerminal = undefined;
        });

        term.open(element);
        term.fit();
        // send the terminal size to the server.
        ws.send(JSON.stringify(["set_size", term.rows, term.cols,
                                window.innerHeight, window.innerWidth]));
        ws.onmessage = function(event) {
          const json_msg = JSON.parse(event.data);
          switch(json_msg[0]) {
            case "stdout":
              term.write(json_msg[1]);
              // console.log('received string of length:', json_msg[1].length, 'from server');
              break;
            case "disconnect":
              term.write("\r\n\r\n[CLOSED]\r\n");
              break;
          }
        };
      };
      return {socket: ws, term: term};
    },

    getFocusedTerminal: () => {
      return terminals.focusedTerminal;
    },

    createTerminalCell: (cellId, config) => {
      if (terminals.terminalsList.hasOwnProperty(cellId)) {
        return terminals.terminalsList[cellId]; // already have this terminal set up
      }
      const cell = utils.findCellByCellId(cellId);
      if (cell !== undefined) {
        const cellJq = $(cell.element);
        const renderArea = cellJq.find('.rendered_html');

        renderArea.html('<div>' +
                        '  <span id="dummy-screen-rows" style="font-family:courier; font-weight:bold; font-size:15px;">bash-3.2$ </span>' +
                        '</div>');
        const lineHeight = renderArea.find('#dummy-screen-rows').height();
        renderArea.html('Loading...');

        const terminalHeight = lineHeight * config.rows; // pixels
        const terminalContainerId = 'terminal-container-' + cellId;
        // height should be set by the number of desired rows passed in with config...
        renderArea.html('<div id="' + terminalContainerId + '" class="container" style="width:100%;height:' + terminalHeight + 'px;"></div>').show();
        const wsUrl = location.protocol.replace('http', 'ws') + '//' + location.host + '/terminals/websocket/' + cellId;
        const elem = $('#' + terminalContainerId);
        const sizeObj = {cols:40, rows:10};

        const newTerminal = terminals._makeTerminal(elem[0], cellId, wsUrl, sizeObj);
        terminals.terminalsList[cellId] = newTerminal;

        elem.bind('click', () => { newTerminal.term.focus(); });

        if (config.startingDirectory !== undefined) {
          const cdCommand = 'cd ' + config.startingDirectory + ';clear' + "\n";
          newTerminal.term.send(cdCommand);
        }

        return newTerminal;
      } else {
        return undefined;
      }
    },

    createTerminalCellAboveSelectedCell: () => {
      const newTerminalCell = Jupyter.notebook.insert_cell_above('markdown');
      if (newTerminalCell !== undefined) {
        const newTerminalCellId = utils.getMetadataCellId(newTerminalCell.metadata);
        if (newTerminalCellId !== undefined) {
          const fullNotebookPath = Jupyter.notebook.notebook_path;
          let notebookPath, notebookPathParts;
          if (fullNotebookPath.indexOf('/') === -1) {
            notebookPath = fullNotebookPath;
          } else {
            notebookPathParts = fullNotebookPath.split('/');
            notebookPath = notebookPathParts.slice(0,notebookPathParts.length - 1).join('/');
          }
          const graffitiConfig = {
            type : 'terminal',
            startingDirectory: notebookPath,
            terminalId: newTerminalCellId, // defaults to the graffiti cell id, but can be changed if author wants to display the same terminal twice in one notebook.
            rows: 6, // default is 6 but can be changed in metadata
          };
          utils.assignCellGraffitiConfig(newTerminalCell, graffitiConfig);
          newTerminalCell.set_text('<i>Loading terminal (' + newTerminalCellId + '), please wait...</i>');
          newTerminalCell.render();
          return terminals.createTerminalCell(newTerminalCellId, graffitiConfig);
        }
      }
      return undefined;
    },

    // If there are terminals present in this notebook, render them.
    renderAllTerminals: () => {
      const cells = Jupyter.notebook.get_cells();
      let cell, cellId;
      for (let i = 0; i < cells.length; ++i) {
        cell = cells[i];
        if (cell.cell_type === 'markdown') {
          if (cell.metadata.hasOwnProperty('graffitiConfig')) {
            cellId = utils.getMetadataCellId(cell.metadata);
            if (cell.metadata.graffitiConfig.type === 'terminal') {
              terminals.createTerminalCell(cellId, cell.metadata.graffitiConfig);
              // make sure you can't double click this cell because that would break the terminal
              $(cell.element[0]).unbind('dblclick').bind('dblclick', ((e) => { 
                e.stopPropagation();
                return false;
              }));
            }
          }
        }
      }
    },

    runTerminalCommand: (terminalId, command, addCR) => {
      // Inject the terminal command into the target terminal (if found).
      if (terminals.terminalsList[terminalId] !== undefined) {
        const term = terminals.terminalsList[terminalId];
        term.term.send(command);
        if (addCR) {
          term.term.send("\n");
        }
      }
    },

    init: () => {
      terminals.renderAllTerminals();
    },


  }

  return terminals;

});