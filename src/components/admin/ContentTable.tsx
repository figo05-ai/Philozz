import React from 'react';

export interface ColumnDef<T> {
  header: string;
  accessor?: (item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface ContentTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  ariaLabel?: string;
}

export function ContentTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No items found in repository.',
  ariaLabel = 'Content Inventory',
}: ContentTableProps<T>) {
  if (data.length === 0) {
    return (
      <div
        style={{
          padding: '2.5rem',
          textAlign: 'center',
          color: 'var(--color-text-dim, #9A9AA8)',
          backgroundColor: 'var(--color-charcoal-card, #16161D)',
          borderRadius: '12px',
          border: '1px solid var(--color-gold-border, rgba(201, 164, 92, 0.22))',
          fontSize: '0.9rem',
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="admin-table-wrapper">
      <div className="admin-table-scroll">
        <table className="admin-table" aria-label={ariaLabel}>
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{
                    width: col.width,
                    textAlign: col.align || 'left',
                  }}
                  className={col.className}
                  scope="col"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const key = keyExtractor(item);
              return (
                <tr key={key}>
                  {columns.map((col, idx) => (
                    <td
                      key={idx}
                      style={{
                        textAlign: col.align || 'left',
                      }}
                      className={col.className}
                    >
                      {col.accessor ? col.accessor(item) : null}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
