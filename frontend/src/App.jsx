import { useEffect, useState } from "react";

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  async function loadPhotos() {
    const res = await fetch("/api/photos");
    if (res.ok) {
      setPhotos(await res.json());
    }
  }

  useEffect(() => {
    loadPhotos();
  }, []);

  function handleFileChange(event) {
    setFile(event.target.files[0] ?? null);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!file || !description.trim()) {
      setError("Please choose an image and enter a description.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("description", description.trim());

    setSubmitting(true);
    try {
      const res = await fetch("/api/photos", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Upload failed.");
      }
      setDescription("");
      setFile(null);
      event.target.reset();
      await loadPhotos();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Photo Gallery</h1>
        <p>Share a moment — drop a photo and add a description.</p>
      </header>

      <form onSubmit={handleSubmit} className="upload-card">
        <div className="upload-row">
          <label
            className={`dropzone${isDragging ? " is-dragging" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <span className="dropzone-icon">📷</span>
            <span className="dropzone-label">
              {file ? <strong>{file.name}</strong> : "Drag & drop or click to choose an image"}
            </span>
          </label>

          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="description-input"
          />

          <button type="submit" disabled={submitting} className="upload-button">
            {submitting ? "Uploading..." : "Upload"}
          </button>
        </div>
        {error && <p className="error-message">{error}</p>}
      </form>

      {photos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🖼️</div>
          <p>No photos yet — be the first to upload one.</p>
        </div>
      ) : (
        <div className="gallery">
          {photos.map((photo, index) => (
            <figure key={photo.id} className="gallery-item" style={{ "--i": index }}>
              <img src={photo.url} alt={photo.description} loading="lazy" />
              <figcaption className="gallery-caption">{photo.description}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </main>
  );
}
