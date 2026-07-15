import { useRef, useState } from 'react';

export default function UploadZone({ onFileSelect }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDragOver(e) { e.preventDefault(); setIsDragging(true); }
  function handleDragLeave()  { setIsDragging(false); }

  function handleDrop(e) {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) onFileSelect(file);
  }

  function handleChange(e) {
    const file = e.target.files[0];
    if (file) onFileSelect(file);
  }

  return (
    <div
      className={`upload-zone ${isDragging ? 'drag-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
    >
      <div className="upload-icon">📷</div>
      <h3>Drop a vehicle image here</h3>
      <p>Supports any vehicle photo — the system will locate and read the number plate</p>
      <button
        className="btn-gradient"
        type="button"
        onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}
      >
        Browse Files
      </button>
      <p className="upload-formats">JPEG · PNG · WEBP · BMP &nbsp;·&nbsp; Max 10 MB</p>
      <input
        ref={inputRef} type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
        onChange={handleChange}
      />
    </div>
  );
}
