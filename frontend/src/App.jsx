import { useEffect, useState } from "react";

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadPhotos() {
    const res = await fetch("/api/photos");
    if (res.ok) {
      setPhotos(await res.json());
    }
  }

  useEffect(() => {
    loadPhotos();
  }, []);

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
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem", fontFamily: "sans-serif" }}>
      <h1>Photo Gallery</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files[0] ?? null)}
          />
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? "Uploading..." : "Upload"}
        </button>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </form>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {photos.map((photo) => (
          <figure key={photo.id} style={{ margin: 0 }}>
            <img
              src={photo.url}
              alt={photo.description}
              style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 8 }}
            />
            <figcaption>{photo.description}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
