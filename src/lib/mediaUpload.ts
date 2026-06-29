const TOKEN_KEY = 'swipd-admin-token'

export async function uploadFileToR2(file: File) {
  try {
    const ticketRes = await fetch('/api/admin/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) || ''}` },
      body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size }),
    })
    const ticket = await ticketRes.json()
    if (ticketRes.ok && ticket.uploadUrl && ticket.publicUrl) {
      const uploadRes = await fetch(ticket.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadRes.ok) throw new Error('Direct R2 upload failed')
      return String(ticket.publicUrl)
    }
  } catch {
    // If R2 CORS is not configured yet, use the server fallback for small files.
  }

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) || ''}` },
    body: JSON.stringify({ fileName: file.name, contentType: file.type, base64 }),
  })
  const data = await res.json()
  if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed')
  return String(data.url)
}
