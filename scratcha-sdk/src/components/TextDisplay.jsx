import React, { useState } from 'react'

const TextDisplay = ({ data, className = '' }) => {
  const [expanded, setExpanded] = useState(false)

  const renderValue = (value, key) => {
    if (typeof value === 'string') {
      return (
        <div key={key} className="mb-2">
          <span className="font-medium text-black">{key}: </span>
          <span className="text-black">{value}</span>
        </div>
      )
    }

    if (typeof value === 'number') {
      return (
        <div key={key} className="mb-2">
          <span className="font-medium text-black">{key}: </span>
          <span className="text-black">{value}</span>
        </div>
      )
    }

    if (typeof value === 'boolean') {
      return (
        <div key={key} className="mb-2">
          <span className="font-medium text-black">{key}: </span>
          <span className={`px-2 py-1 rounded text-xs ${value ? 'bg-green-100 text-black' : 'bg-red-100 text-black'}`}>
            {value ? 'True' : 'False'}
          </span>
        </div>
      )
    }

    if (Array.isArray(value)) {
      return (
        <div key={key} className="mb-3">
          <span className="font-medium text-black">{key}: </span>
          <div className="ml-4 mt-1">
            {value.map((item, index) => (
              <div key={index} className="mb-1">
                <span className="text-black">[{index}]: </span>
                {typeof item === 'object' ? (
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto text-black">
                    {JSON.stringify(item, null, 2)}
                  </pre>
                ) : (
                  <span className="text-black">{String(item)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <div key={key} className="mb-3">
          <span className="font-medium text-black">{key}: </span>
          <div className="ml-4 mt-1">
            {Object.entries(value).map(([subKey, subValue]) =>
              renderValue(subValue, subKey)
            )}
          </div>
        </div>
      )
    }

    return (
      <div key={key} className="mb-2">
        <span className="font-medium text-black">{key}: </span>
        <span className="text-black italic">null/undefined</span>
      </div>
    )
  }

  const renderData = () => {
    if (!data) {
      return <div className="text-black italic">데이터가 없습니다.</div>
    }

    if (typeof data === 'string') {
      return (
        <div className="bg-gray-50 p-3 rounded border">
          <pre className="whitespace-pre-wrap text-sm text-black">{data}</pre>
        </div>
      )
    }

    if (typeof data === 'object') {
      const entries = Object.entries(data)
      const displayEntries = expanded ? entries : entries.slice(0, 5)

      return (
        <div className="space-y-2">
          <div className="bg-gray-50 p-3 rounded border">
            {displayEntries.map(([key, value]) => renderValue(value, key))}
            {entries.length > 5 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-black hover:text-gray-700 text-sm mt-2"
              >
                {expanded ? '접기' : `${entries.length - 5}개 더 보기`}
              </button>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="bg-gray-50 p-3 rounded border">
        <span className="text-black">{String(data)}</span>
      </div>
    )
  }

  return (
    <div className={`text-display ${className}`}>
      {renderData()}
    </div>
  )
}

export default TextDisplay
