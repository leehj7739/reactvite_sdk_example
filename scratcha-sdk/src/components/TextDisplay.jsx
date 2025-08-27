import React, { useState } from 'react'

const TextDisplay = ({ data }) => {
  const [expanded, setExpanded] = useState(false)

  const renderValue = (value, key) => {
    if (typeof value === 'string') {
      return (
        <div key={key} className="data-item">
          <span className="data-label">{key}: </span>
          <span className="data-value">{value}</span>
        </div>
      )
    }

    if (typeof value === 'number') {
      return (
        <div key={key} className="data-item">
          <span className="data-label">{key}: </span>
          <span className="data-value">{value}</span>
        </div>
      )
    }

    if (typeof value === 'boolean') {
      return (
        <div key={key} className="data-item">
          <span className="data-label">{key}: </span>
          <span className={`data-value boolean ${value ? 'true' : 'false'}`}>
            {value ? 'True' : 'False'}
          </span>
        </div>
      )
    }

    if (Array.isArray(value)) {
      return (
        <div key={key} className="data-item">
          <span className="data-label">{key}: </span>
          <div className="data-container">
            {value.map((item, index) => (
              <div key={index} className="array-item">
                <span className="array-index">[{index}]: </span>
                {typeof item === 'object' ? (
                  <pre className="json-display">
                    {JSON.stringify(item, null, 2)}
                  </pre>
                ) : (
                  <span className="data-value">{String(item)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <div key={key} className="data-item">
          <span className="data-label">{key}: </span>
          <div className="data-container">
            {Object.entries(value).map(([subKey, subValue]) =>
              renderValue(subValue, subKey)
            )}
          </div>
        </div>
      )
    }

    return (
      <div key={key} className="data-item">
        <span className="data-label">{key}: </span>
        <span className="data-value italic">null/undefined</span>
      </div>
    )
  }

  const renderData = () => {
    if (!data) {
      return <div className="no-data">데이터가 없습니다.</div>
    }

    if (typeof data === 'string') {
      return (
        <div className="data-wrapper">
          <pre className="whitespace-pre-wrap">{data}</pre>
        </div>
      )
    }

    if (typeof data === 'object') {
      const entries = Object.entries(data)
      const displayEntries = expanded ? entries : entries.slice(0, 5)

      return (
        <div className="space-y-2">
          <div className="data-wrapper">
            {displayEntries.map(([key, value]) => renderValue(value, key))}
            {entries.length > 5 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="expand-button"
              >
                {expanded ? '접기' : `${entries.length - 5}개 더 보기`}
              </button>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="data-wrapper">
        <span className="data-value">{String(data)}</span>
      </div>
    )
  }

  return (
    <div className="text-display">
      {renderData()}
    </div>
  )
}

export default TextDisplay
