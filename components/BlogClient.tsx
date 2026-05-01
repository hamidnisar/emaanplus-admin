'use client';

import React, { useState, useRef } from 'react';
import { storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { BlogPost } from '@/lib/types';

const ACCEPTED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ACCEPTED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime'];
const ACCEPTED_ALL   = [...ACCEPTED_IMAGE, ...ACCEPTED_VIDEO];

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function extractYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m) return m[1];
  }
  return null;
}

function ytThumb(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function ytEmbed(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}`;
}

function getYouTubeIdFromEmbed(url: string) {
  return url.split('/embed/')[1]?.split('?')[0] || '';
}

function ImageIcon()   { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="5.5" cy="6" r="1.2" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 11l3.5-3.5 3 3 2-2 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function VideoIcon()   { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="10" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M11.5 6l3-2v8l-3-2V6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> }
function YoutubeIcon() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6.5 6l4 2-4 2V6Z" fill="currentColor"/></svg> }
function TrashIcon()   { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M6 8v5M10 8v5M4 5l1 9h6l1-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function UploadIcon()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EyeIcon()     { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/></svg> }
function EyeOffIcon()  { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M6.5 6.6A2 2 0 0 0 9.4 9.5M4.2 4.3C2.7 5.4 1.5 7 1 8c1 2.2 3.8 5 7 5a7 7 0 0 0 3.7-1.1M6 3.2A7 7 0 0 1 8 3c3.2 0 6 2.8 7 5-.4.9-1 1.8-1.8 2.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function PlayIcon()    { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="rgba(0,0,0,0.55)"/><path d="M10 8.5l6 3.5-6 3.5V8.5Z" fill="white"/></svg> }

export default function BlogClient({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);

  // shared form state
  const [uploadMode, setUploadMode] = useState<'file' | 'youtube'>('file');
  const [userName, setUserName]     = useState('');
  const [caption, setCaption]       = useState('');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState<string | null>(null);
  const [filter, setFilter]         = useState<'all' | 'published' | 'draft'>('all');

  // file-upload state
  const [file, setFile]           = useState<File | null>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const [progress, setProgress]   = useState(0);
  const fileInputRef              = useRef<HTMLInputElement>(null);

  // youtube state
  const [ytInput, setYtInput] = useState('');
  const ytId = extractYouTubeId(ytInput);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_ALL.includes(f.type)) {
      setError('Unsupported file type. Use JPG, PNG, WebP, GIF, MP4, WebM, or MOV.');
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      setError('File too large. Maximum 100 MB.');
      return;
    }
    setFile(f);
    setError(null);
    setPreview(URL.createObjectURL(f));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFileChange({ target: { files: e.dataTransfer.files } } as any);
  }

  function resetForm() {
    setUserName('');
    setCaption('');
    setFile(null);
    setPreview(null);
    setProgress(0);
    setYtInput('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSaveFile() {
    if (!userName.trim()) { setError('User name is required.'); return; }
    if (!file) { setError('Please select a photo or video.'); return; }

    setSaving(true);
    setError(null);
    setSuccess(null);
    setProgress(0);

    try {
      const isVideo   = ACCEPTED_VIDEO.includes(file.type);
      const mediaType = isVideo ? 'video' : 'image';
      const ext       = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const path      = `blog/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const fRef      = storageRef(storage, path);
      const task      = uploadBytesResumable(fRef, file, { contentType: file.type });

      const mediaUrl = await new Promise<string>((resolve, reject) => {
        task.on(
          'state_changed',
          snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          async () => resolve(await getDownloadURL(task.snapshot.ref)),
        );
      });

      await savePost({ userName, caption, mediaType, mediaUrl });
    } catch (e: any) {
      setError(e.message || 'Upload failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveYoutube() {
    if (!userName.trim()) { setError('User name is required.'); return; }
    if (!ytId) { setError('Enter a valid YouTube URL or video ID.'); return; }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await savePost({ userName, caption, mediaType: 'youtube', mediaUrl: ytEmbed(ytId) });
    } catch (e: any) {
      setError(e.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function savePost(payload: {
    userName: string;
    caption: string;
    mediaType: 'image' | 'video' | 'youtube';
    mediaUrl: string;
  }) {
    const res  = await fetch('/api/blog', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...payload, status: 'published' }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save post');

    const newPost: BlogPost = {
      id:           data.id,
      userName:     payload.userName.trim(),
      caption:      payload.caption.trim(),
      mediaType:    payload.mediaType,
      mediaUrl:     payload.mediaUrl,
      thumbnailUrl: null,
      status:       'published',
      createdAt:    new Date().toISOString(),
    };

    setPosts(prev => [newPost, ...prev]);
    setSuccess(`"${payload.userName}" review added successfully!`);
    resetForm();
  }

  async function toggleStatus(post: BlogPost) {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    await fetch(`/api/blog/${post.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: newStatus }),
    });
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: newStatus } : p));
  }

  async function deletePost(post: BlogPost) {
    if (!confirm(`Delete ${post.userName}'s review? This cannot be undone.`)) return;
    await fetch(`/api/blog/${post.id}`, { method: 'DELETE' });
    setPosts(prev => prev.filter(p => p.id !== post.id));
  }

  const filtered  = filter === 'all' ? posts : posts.filter(p => p.status === filter);
  const published = posts.filter(p => p.status === 'published').length;
  const drafts    = posts.filter(p => p.status === 'draft').length;
  const ytCount   = posts.filter(p => p.mediaType === 'youtube').length;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    background: 'var(--surface2)',
    border: '0.5px solid var(--border2)',
    borderRadius: '8px', fontSize: '13px',
    fontFamily: 'var(--font)', color: 'var(--text)', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 600,
    color: 'var(--text2)', marginBottom: '6px',
    letterSpacing: '0.5px', fontFamily: 'var(--font-mono)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px' }}>
        {[
          { label: 'Total reviews', value: posts.length, color: 'var(--accent)'  },
          { label: 'Published',     value: published,    color: 'var(--success)' },
          { label: 'Drafts',        value: drafts,       color: 'var(--warning)' },
          { label: 'YouTube',       value: ytCount,      color: '#ff0000'        },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px' }}>
            <div style={{
              fontSize: '10px', fontWeight: 600, color: 'var(--text3)',
              letterSpacing: '0.7px', fontFamily: 'var(--font-mono)', marginBottom: '6px',
            }}>
              {s.label.toUpperCase()}
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '16px', alignItems: 'start' }}>

        {/* Left: grid of posts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'published', 'draft'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '6px 14px', borderRadius: '8px', fontSize: '12px',
                fontFamily: 'var(--font)', cursor: 'pointer',
                fontWeight: filter === f ? 600 : 400,
                background: filter === f ? 'var(--accent)' : 'var(--surface2)',
                color:      filter === f ? 'white' : 'var(--text2)',
                border:     filter === f ? '0.5px solid var(--accent)' : '0.5px solid var(--border2)',
                transition: 'all 0.15s',
              }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'all' && ` (${posts.length})`}
                {f === 'published' && ` (${published})`}
                {f === 'draft' && ` (${drafts})`}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.4 }}>◎</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                No reviews yet
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text3)' }}>
                Use the form on the right to add a review
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
              {filtered.map(post => {
                const isYt    = post.mediaType === 'youtube';
                const videoId = isYt ? getYouTubeIdFromEmbed(post.mediaUrl) : '';

                return (
                  <div key={post.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>

                    {/* Media */}
                    <div style={{
                      position: 'relative', width: '100%',
                      aspectRatio: '16/9', background: 'var(--surface2)', overflow: 'hidden',
                    }}>
                      {isYt ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={ytThumb(videoId)}
                            alt={post.userName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <a
                              href={`https://www.youtube.com/watch?v=${videoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ display: 'flex', color: 'white' }}
                            >
                              <PlayIcon />
                            </a>
                          </div>
                        </>
                      ) : post.mediaType === 'video' ? (
                        <video
                          src={post.mediaUrl}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          muted preload="metadata"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.mediaUrl}
                          alt={post.userName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}

                      {/* Media type badge */}
                      <div style={{
                        position: 'absolute', top: '8px', left: '8px',
                        background: isYt ? 'rgba(255,0,0,0.8)' : 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: '6px', padding: '3px 7px',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        color: 'white', fontSize: '11px', fontFamily: 'var(--font-mono)',
                      }}>
                        {isYt ? <YoutubeIcon /> : post.mediaType === 'video' ? <VideoIcon /> : <ImageIcon />}
                        {isYt ? 'YouTube' : post.mediaType}
                      </div>

                      {/* Status badge */}
                      <div style={{
                        position: 'absolute', top: '8px', right: '8px',
                        background: post.status === 'published' ? 'rgba(34,197,94,0.85)' : 'rgba(234,179,8,0.85)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: '6px', padding: '3px 7px',
                        color: 'white', fontSize: '10px', fontWeight: 600, fontFamily: 'var(--font-mono)',
                      }}>
                        {post.status}
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ padding: '12px' }}>
                      <div style={{
                        fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {post.userName}
                      </div>
                      {post.caption && (
                        <div style={{
                          fontSize: '12px', color: 'var(--text2)', marginBottom: '8px', lineHeight: 1.5,
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {post.caption}
                        </div>
                      )}
                      <div style={{
                        fontSize: '11px', color: 'var(--text3)',
                        fontFamily: 'var(--font-mono)', marginBottom: '10px',
                      }}>
                        {formatDate(post.createdAt)}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => toggleStatus(post)}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: '5px',
                            padding: '6px 10px', borderRadius: '7px',
                            border: '0.5px solid var(--border2)',
                            background: 'var(--surface2)', color: 'var(--text2)',
                            fontSize: '11px', fontFamily: 'var(--font)', cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {post.status === 'published' ? <EyeOffIcon /> : <EyeIcon />}
                          {post.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => deletePost(post)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '6px 10px', borderRadius: '7px',
                            border: '0.5px solid var(--danger)',
                            background: 'var(--danger-bg)', color: 'var(--danger)',
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: form */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['file', 'youtube'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setUploadMode(m); setError(null); setSuccess(null); }}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px',
                  fontFamily: 'var(--font)', cursor: 'pointer', fontWeight: uploadMode === m ? 600 : 400,
                  background: uploadMode === m ? (m === 'youtube' ? '#ff0000' : 'var(--accent)') : 'var(--surface2)',
                  color:      uploadMode === m ? 'white' : 'var(--text2)',
                  border:     uploadMode === m
                    ? `0.5px solid ${m === 'youtube' ? '#ff0000' : 'var(--accent)'}`
                    : '0.5px solid var(--border2)',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                {m === 'youtube' ? <YoutubeIcon /> : <UploadIcon />}
                {m === 'file' ? 'Upload file' : 'YouTube'}
              </button>
            ))}
          </div>

          {/* User name */}
          <div>
            <label style={labelStyle}>USER NAME *</label>
            <input
              style={inputStyle}
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="e.g. Ahmed Khan"
            />
          </div>

          {/* Caption */}
          <div>
            <label style={labelStyle}>CAPTION</label>
            <textarea
              style={{ ...inputStyle, minHeight: '68px', resize: 'vertical' }}
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="User's review or description..."
            />
          </div>

          {/* ── File upload section ── */}
          {uploadMode === 'file' && (
            <div>
              <label style={labelStyle}>PHOTO / VIDEO *</label>
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1.5px dashed var(--border2)', borderRadius: '10px',
                  padding: '24px 16px', textAlign: 'center',
                  cursor: 'pointer', background: 'var(--surface2)',
                }}
              >
                {preview && file ? (
                  <>
                    {ACCEPTED_VIDEO.includes(file.type) ? (
                      <video src={preview} style={{ maxWidth: '100%', maxHeight: '130px', borderRadius: '6px' }} muted />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: '130px', borderRadius: '6px', objectFit: 'contain' }} />
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                      {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ color: 'var(--text3)', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                      <UploadIcon />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                      Drop file or click to browse
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                      JPG, PNG, WebP, GIF, MP4, WebM · max 100 MB
                    </div>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept={ACCEPTED_ALL.join(',')} style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
          )}

          {/* ── YouTube section ── */}
          {uploadMode === 'youtube' && (
            <div>
              <label style={labelStyle}>YOUTUBE URL OR VIDEO ID *</label>
              <input
                style={inputStyle}
                value={ytInput}
                onChange={e => { setYtInput(e.target.value); setError(null); }}
                placeholder="https://youtu.be/dQw4w9WgXcQ  or  dQw4w9WgXcQ"
              />

              {/* Live validation feedback */}
              {ytInput && (
                <div style={{
                  marginTop: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)',
                  color: ytId ? 'var(--success)' : 'var(--danger)',
                }}>
                  {ytId ? `✓ Video ID: ${ytId}` : '✗ Could not find a valid YouTube video ID'}
                </div>
              )}

              {/* Thumbnail preview */}
              {ytId && (
                <div style={{ marginTop: '10px', position: 'relative', borderRadius: '8px', overflow: 'hidden', lineHeight: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ytThumb(ytId)}
                    alt="YouTube thumbnail"
                    style={{ width: '100%', borderRadius: '8px' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <PlayIcon />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress bar (file upload only) */}
          {saving && uploadMode === 'file' && (
            <div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '11px', color: 'var(--text3)', marginBottom: '5px', fontFamily: 'var(--font-mono)',
              }}>
                <span>Uploading…</span><span>{progress}%</span>
              </div>
              <div style={{ background: 'var(--surface2)', borderRadius: '4px', height: '5px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '4px', background: 'var(--accent)',
                  width: `${progress}%`, transition: 'width 0.2s',
                }} />
              </div>
            </div>
          )}

          {/* Error / success */}
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px',
              background: 'var(--danger-bg)', border: '0.5px solid var(--danger)',
              color: 'var(--danger)', fontSize: '13px', fontWeight: 500,
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px',
              background: 'var(--success-bg)', border: '0.5px solid var(--success)',
              color: 'var(--success)', fontSize: '13px', fontWeight: 500,
            }}>
              {success}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={resetForm} className="btn" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
              Clear
            </button>
            <button
              onClick={uploadMode === 'file' ? handleSaveFile : handleSaveYoutube}
              disabled={saving || (uploadMode === 'file' ? !file : !ytId) || !userName.trim()}
              className="btn btn-primary"
              style={{
                flex: 2, justifyContent: 'center',
                ...(uploadMode === 'youtube' && !saving ? { background: '#ff0000', borderColor: '#ff0000' } : {}),
              }}
            >
              {saving
                ? uploadMode === 'file' ? `Uploading ${progress}%…` : 'Saving…'
                : uploadMode === 'file' ? 'Upload review' : 'Add YouTube review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
