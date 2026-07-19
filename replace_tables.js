const fs = require('fs');
const path = require('path');

const directory = '/Users/steven/go/github.com/LogChopper/app/_components/FlowNodes';

const filesToUpdate = [
  'AfrShift/AfrShiftNode.tsx',
  'LogAlter/LogAlterNode.tsx',
  'LogFilter/LogFilterNode.tsx',
  'MovingAverageLogFilter/MovingAverageLogFilterNode.tsx',
  'RunningLogAlter/RunningLogAlterNode.tsx',
  'TpsAfrDelete/TpsAfrDeleteNode.tsx'
];

const newColumns = `  const columns = useMemo(() => {
    if (!data.logs || data.logs.length === 0) return []
    return Object.keys(data.logs[0] || {}).map(c => {
      return columnHelper.accessor(c, {
        cell: info => {
          const val = info.getValue()
          if (typeof val === 'number') return val.toFixed(2)
          return val
        },
        footer: info => info.column.id,
      })
    })
  }, [data.logs, columnHelper])`;

const newTableContainer = `      {
        expanded
        && <div
          className="container mt-2 bg-white"
          ref={tableContainerRef}
          style={{
            overflow: 'auto',
            position: 'relative',
            height: '400px',
            border: '1px solid black'
          }}
        >
          <table style={{ display: 'grid' }}>
            <thead
              style={{
                display: 'grid',
                position: 'sticky',
                top: 0,
                zIndex: 1,
                background: '#f3f4f6'
              }}
            >
              {table.getHeaderGroups().map(headerGroup => (
                <tr
                  key={headerGroup.id}
                  style={{ display: 'flex', width: '100%' }}
                >
                  {headerGroup.headers.map(header => {
                    return (
                      <th
                        key={header.id}
                        style={{
                          display: 'flex',
                          width: header.getSize(),
                          padding: '4px',
                          borderRight: '1px solid #e5e7eb',
                          borderBottom: '1px solid #e5e7eb'
                        }}
                      >
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? 'cursor-pointer select-none'
                              : '',
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody
              style={{
                display: 'grid',
                height: \`\${rowVirtualizer.getTotalSize()}px\`,
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const row = rows[virtualRow.index] as Row<LogRecord>
                return (
                  <tr
                    data-index={virtualRow.index}
                    key={row.id}
                    style={{
                      display: 'flex',
                      position: 'absolute',
                      transform: \`translateY(\${virtualRow.start}px)\`,
                      width: '100%',
                      borderBottom: '1px solid #e5e7eb'
                    }}
                  >
                    {row.getVisibleCells().map(cell => {
                      return (
                        <td
                          key={cell.id}
                          style={{
                            display: 'flex',
                            width: cell.column.getSize(),
                            padding: '4px',
                            borderRight: '1px solid #e5e7eb'
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      }`;

filesToUpdate.forEach(relPath => {
  const fullPath = path.join(directory, relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');

    // Replace columns definition
    const columnsRegex = /const columns = useMemo\(\(\) => \{[\s\S]*?\}, \[data\.logs, columnHelper\]\)/;
    if (columnsRegex.test(content)) {
      content = content.replace(columnsRegex, newColumns);
      console.log(`Replaced columns in ${relPath}`);
    } else {
      console.log(`Failed to find columns block in ${relPath}`);
    }

    // Replace table container
    const tableContainerRegex = /\{\s*expanded\s*&& <div\s*className="container"[\s\S]*?<\/div>\s*\}/;
    if (tableContainerRegex.test(content)) {
      content = content.replace(tableContainerRegex, newTableContainer);
      console.log(`Replaced table container in ${relPath}`);
    } else {
      console.log(`Failed to find table container block in ${relPath}`);
    }

    fs.writeFileSync(fullPath, content, 'utf8');
  } else {
    console.log(`File not found: ${fullPath}`);
  }
});
