'use client';

/**
 * PHILOZZ CMS — Media Library Management Studio
 * Phase 16E.0: Media Library Foundation & Storage Provider Readiness
 *
 * Implements complete owner-only digital asset management:
 * 1. Dual view modes (Cinematic Grid & Structured Table)
 * 2. Instant search and folder/tag filtering
 * 3. Deep asset inspector with live dimensions, MIME, size, and metadata editing
 * 4. Real-time usage resolution across Projects, Articles, Sections, Brand & SEO
 * 5. Safe deletion controls (strictly disabled when asset is in use)
 * 6. 6-step guided asset replacement workflow
 * 7. Honest provider setup-required state (zero fake upload buttons)
 */

import React, { useState, useTransition, useMemo } from 'react';
import Image from 'next/image';
import {
  Image as ImageIcon,
  LayoutGrid,
  List,
  Search,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Info,
  HardDrive,
  FileText,
  Save,
  X,
  Lock,
  CloudOff,
  CheckCircle2,
  Upload,
  UploadCloud,
  Loader2,
} from 'lucide-react';
import {
  validateMediaMagicBytes,
  MAX_MEDIA_FILE_SIZE,
  MAX_PDF_FILE_SIZE,
} from '@/cms/validation/mediaValidators';
import type {
  MediaAssetEntity,
  MediaFolder,
  MediaProviderType,
  MediaUsageReport,
  MediaUsageReference,
} from '@/cms/models/media';
import {
  updateMediaMetadataAction,
  deleteMediaAssetAction,
  restoreMediaAssetAction,
  permanentlyDeleteMediaAssetAction,
  replaceAssetReferenceAction,
  ReplaceAssetTarget,
} from '@/app/admin/media/actions';
import { STORAGE_PROVIDER_COMPARISON } from '@/cms/media/mediaStorageProvider';

export interface MediaLibraryViewProps {
  initialAssets: MediaAssetEntity[];
  initialUsageMap: Record<string, MediaUsageReport>;
  activeProvider: MediaProviderType;
  isUploadConfigured: boolean;
  ownerUid: string;
}

export function MediaLibraryView({
  initialAssets,
  initialUsageMap,
  activeProvider,
  isUploadConfigured,
  ownerUid,
}: MediaLibraryViewProps) {
  const [assets, setAssets] = useState<MediaAssetEntity[]>(initialAssets);
  const [usageMap, setUsageMap] = useState<Record<string, MediaUsageReport>>(initialUsageMap);

  // View & Filter states
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showDeleted, setShowDeleted] = useState<boolean>(false);

  // Inspector & modal states
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(
    initialAssets.length > 0 ? initialAssets[0].id : null
  );
  const [isProviderModalOpen, setIsProviderModalOpen] = useState<boolean>(false);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState<boolean>(false);
  const [selectedReplaceTarget, setSelectedReplaceTarget] = useState<MediaUsageReference | null>(null);
  const [replacementAssetId, setReplacementAssetId] = useState<string>('');

  // Upload modal & pipeline states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [uploadDimensions, setUploadDimensions] = useState<{ width: number; height: number } | null>(null);
  const [uploadFolder, setUploadFolder] = useState<MediaFolder>('general');
  const [uploadAltText, setUploadAltText] = useState<string>('');
  const [uploadCaption, setUploadCaption] = useState<string>('');
  const [uploadTags, setUploadTags] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStage, setUploadStage] = useState<
    'idle' | 'validating' | 'signing' | 'uploading' | 'verifying' | 'done' | 'error'
  >('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const activeXhrRef = React.useRef<XMLHttpRequest | null>(null);

  // Reconcile modal states
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orphanedAssets, setOrphanedAssets] = useState<any[]>([]);
  const [isCheckingOrphans, setIsCheckingOrphans] = useState<boolean>(false);
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);

  // Editing metadata in inspector
  const firstAsset = initialAssets.length > 0 ? initialAssets[0] : null;
  const [editAltText, setEditAltText] = useState<string>(firstAsset?.altText || '');
  const [editCaption, setEditCaption] = useState<string>(firstAsset?.caption || '');
  const [editFolder, setEditFolder] = useState<MediaFolder>(firstAsset?.folder || 'general');
  const [editTags, setEditTags] = useState<string>((firstAsset?.tags || []).join(', '));

  // Status message
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const handleSelectAsset = (asset: MediaAssetEntity) => {
    setSelectedAssetId(asset.id);
    setEditAltText(asset.altText || '');
    setEditCaption(asset.caption || '');
    setEditFolder(asset.folder || 'general');
    setEditTags((asset.tags || []).join(', '));
    setCopiedUrl(false);
  };

  // Selected asset entity & usage
  const selectedAsset = useMemo(() => {
    return assets.find((a) => a.id === selectedAssetId) || null;
  }, [assets, selectedAssetId]);

  const selectedUsage = useMemo(() => {
    if (!selectedAssetId) return null;
    return usageMap[selectedAssetId] || null;
  }, [usageMap, selectedAssetId]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => a.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [assets]);

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Soft deletion filter
      if (!showDeleted && asset.isDeleted) return false;
      if (showDeleted && !asset.isDeleted) return false;

      // Folder filter
      if (selectedFolder !== 'all' && asset.folder !== selectedFolder) {
        return false;
      }

      // Tag filter
      if (selectedTag !== 'all' && !asset.tags?.includes(selectedTag)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName =
          asset.originalName?.toLowerCase().includes(q) ||
          asset.filename?.toLowerCase().includes(q);
        const matchesAlt = asset.altText?.toLowerCase().includes(q);
        const matchesTag = asset.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesAlt && !matchesTag) return false;
      }

      return true;
    });
  }, [assets, showDeleted, selectedFolder, selectedTag, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalBytes = assets.reduce((sum, a) => sum + (a.sizeBytes || 0), 0);
    const inUseCount = assets.filter((a) => usageMap[a.id]?.isInUse).length;
    return {
      count: assets.length,
      totalMb: (totalBytes / (1024 * 1024)).toFixed(1),
      inUseCount,
      unusedCount: assets.length - inUseCount,
    };
  }, [assets, usageMap]);

  // Copy URL to clipboard
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Save metadata changes
  const handleSaveMetadata = () => {
    if (!selectedAsset) return;

    startTransition(async () => {
      setStatusMsg(null);
      const tagsArray = editTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await updateMediaMetadataAction(selectedAsset.id, {
        altText: editAltText,
        caption: editCaption,
        folder: editFolder,
        tags: tagsArray,
      });

      if (res.success && res.data) {
        setStatusMsg({ type: 'success', text: 'Asset metadata updated successfully.' });
        setAssets((prev) =>
          prev.map((a) => (a.id === selectedAsset.id ? res.data! : a))
        );
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to update metadata.' });
      }
    });
  };

  // Safe soft delete
  const handleDeleteAsset = () => {
    if (!selectedAsset) return;

    if (selectedUsage?.isInUse) {
      setStatusMsg({
        type: 'error',
        text: `Cannot delete asset "${selectedAsset.filename}": It is actively referenced by ${selectedUsage.references.length} content entity.`,
      });
      return;
    }

    if (!confirm(`Are you sure you want to soft-delete "${selectedAsset.originalName}"?`)) {
      return;
    }

    startTransition(async () => {
      setStatusMsg(null);
      const res = await deleteMediaAssetAction(selectedAsset.id);
      if (res.success) {
        setStatusMsg({ type: 'success', text: `Asset "${selectedAsset.originalName}" soft-deleted.` });
        setAssets((prev) =>
          prev.map((a) => (a.id === selectedAsset.id ? { ...a, isDeleted: true } : a))
        );
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to delete asset.' });
      }
    });
  };

  // Restore soft-deleted asset
  const handleRestoreAsset = (id: string) => {
    startTransition(async () => {
      setStatusMsg(null);
      const res = await restoreMediaAssetAction(id);
      if (res.success && res.data) {
        setStatusMsg({ type: 'success', text: `Asset "${res.data.originalName}" restored.` });
        setAssets((prev) =>
          prev.map((a) => (a.id === id ? res.data! : a))
        );
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to restore asset.' });
      }
    });
  };

  // Phase 16E.3: Permanent remote deletion with fail-closed safeguards
  const handlePermanentDeleteAsset = () => {
    if (!selectedAsset) return;

    if (selectedUsage?.isInUse) {
      setStatusMsg({
        type: 'error',
        text: `Cannot permanently delete asset "${selectedAsset.filename}": It is actively referenced by ${selectedUsage.references.length} content entity. Replace references first.`,
      });
      return;
    }

    if (selectedAsset.provider === 'local') {
      setStatusMsg({
        type: 'error',
        text: 'Local repository assets are part of static code versioning and cannot be permanently deleted via cloud API. Use Safe Soft Delete instead.',
      });
      return;
    }

    const confirmMsg =
      `WARNING: Are you sure you want to PERMANENTLY delete "${selectedAsset.originalName}" from ImageKit remote storage and the database?\n\n` +
      `• File: ${selectedAsset.filename}\n` +
      `• Provider: ${selectedAsset.provider}\n\n` +
      `This action CANNOT be undone.`;

    if (!confirm(confirmMsg)) {
      return;
    }

    startTransition(async () => {
      setStatusMsg(null);
      const res = await permanentlyDeleteMediaAssetAction(selectedAsset.id);
      if (res.success) {
        setStatusMsg({
          type: 'success',
          text: `Asset "${selectedAsset.originalName}" permanently deleted from remote storage and database.`,
        });
        const remaining = assets.filter((a) => a.id !== selectedAsset.id);
        setAssets(remaining);
        setSelectedAssetId(remaining.length > 0 ? remaining[0].id : null);
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'Failed to permanently delete media asset.',
        });
      }
    });
  };

  // Execute safe replacement
  const handleExecuteReplacement = () => {
    if (!selectedAsset || !selectedReplaceTarget || !replacementAssetId) return;

    const targetPayload: ReplaceAssetTarget = {
      entityType: selectedReplaceTarget.entityType,
      entityId: selectedReplaceTarget.entityId,
      field: selectedReplaceTarget.field,
    };

    startTransition(async () => {
      setStatusMsg(null);
      const res = await replaceAssetReferenceAction(
        selectedAsset.id,
        replacementAssetId,
        targetPayload
      );

      if (res.success && res.data) {
        setStatusMsg({
          type: 'success',
          text: `Asset reference safely replaced in ${selectedReplaceTarget.entityTitle}. Original asset retained until all references clear.`,
        });
        setUsageMap((prev) => ({
          ...prev,
          [selectedAsset.id]: res.data!.oldAssetUsage,
        }));
        setIsReplaceModalOpen(false);
        setSelectedReplaceTarget(null);
        setReplacementAssetId('');
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Replacement failed.' });
      }
    });
  };

  // Handle file selection with client-side magic-bytes & size verification (Raster + PDF)
  const handleFileSelect = async (file: File) => {
    setUploadError(null);
    setUploadStage('validating');

    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const isPdf = ext === '.pdf' || file.type === 'application/pdf';

    // 1. File size check (15MB for raster images, configurable MAX_PDF_FILE_SIZE for PDF)
    const allowedLimit = isPdf ? MAX_PDF_FILE_SIZE : MAX_MEDIA_FILE_SIZE;
    const limitLabel = isPdf
      ? `${(MAX_PDF_FILE_SIZE / (1024 * 1024)).toFixed(0)} MB`
      : '15 MB';
    if (file.size > allowedLimit) {
      setUploadError(
        `File exceeds maximum size limit of ${limitLabel} (${(file.size / (1024 * 1024)).toFixed(2)} MB).`
      );
      setUploadStage('error');
      return;
    }

    // 2. Extension check (Strict Raster images + PDF only)
    const forbiddenExts = ['.exe', '.sh', '.php', '.html', '.js', '.ts', '.svg', '.bat', '.cmd'];
    if (forbiddenExts.includes(ext)) {
      setUploadError(
        `Forbidden file format "${ext}". Only raster images (JPEG, PNG, WebP, GIF) and PDF documents are accepted.`
      );
      setUploadStage('error');
      return;
    }

    // 3. Client-side Magic Bytes Header Inspection
    try {
      const slice = file.slice(0, 16);
      const arrayBuffer = await slice.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const magicResult = validateMediaMagicBytes(bytes, isPdf ? 'application/pdf' : file.type);
      if (!magicResult.valid) {
        setUploadError(magicResult.error || 'Binary header does not match accepted media format.');
        setUploadStage('error');
        return;
      }
    } catch {
      setUploadError('Failed to inspect file header signatures.');
      setUploadStage('error');
      return;
    }

    // 4. Generate local preview & inspect natural dimensions
    if (uploadPreviewUrl) {
      URL.revokeObjectURL(uploadPreviewUrl);
    }

    if (isPdf) {
      setUploadPreviewUrl(null);
      setUploadDimensions(null);
    } else {
      const preview = URL.createObjectURL(file);
      setUploadPreviewUrl(preview);

      const img = new window.Image();
      img.onload = () => {
        setUploadDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        setUploadDimensions(null);
      };
      img.src = preview;
    }

    setUploadFile(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setUploadAltText(cleanName);
    setUploadStage('idle');
  };

  // Cancel in-flight upload
  const handleCancelUpload = () => {
    if (activeXhrRef.current) {
      activeXhrRef.current.abort();
      activeXhrRef.current = null;
    }
    setUploadStage('idle');
    setUploadProgress(0);
    setUploadError('Upload cancelled by owner.');
  };

  // Execute full authenticated upload pipeline
  const handleStartUpload = async () => {
    if (!uploadFile) return;
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Step 1: Request short-lived upload authorization from server
      setUploadStage('signing');
      const signRes = await fetch('/api/admin/media/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: uploadFile.name,
          mimeType: uploadFile.type,
          folder: uploadFolder,
          sizeBytes: uploadFile.size,
        }),
      });

      const signData = await signRes.json();
      if (!signRes.ok || !signData.success || !signData.auth) {
        throw new Error(signData.message || signData.error || 'Upload signing authorization failed.');
      }

      const { auth } = signData;

      // Step 2: Direct browser-to-ImageKit upload (0 Next.js / Vercel proxying)
      setUploadStage('uploading');
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (auth.fields) {
        Object.entries(auth.fields).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            formData.append(k, String(v));
          }
        });
      }

      const ikResponse = await new Promise<{
        fileId: string;
        url: string;
        thumbnailUrl?: string;
        size?: number;
        width?: number;
        height?: number;
        name?: string;
        mime?: string;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        activeXhrRef.current = xhr;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          activeXhrRef.current = null;
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const resJson = JSON.parse(xhr.responseText);
              resolve(resJson);
            } catch {
              reject(new Error('Malformed JSON received from ImageKit upload API.'));
            }
          } else {
            try {
              const errJson = JSON.parse(xhr.responseText);
              reject(new Error(errJson.message || `ImageKit rejected upload (HTTP ${xhr.status}).`));
            } catch {
              reject(new Error(`ImageKit rejected upload (HTTP ${xhr.status}).`));
            }
          }
        };

        xhr.onerror = () => {
          activeXhrRef.current = null;
          reject(new Error('Network error during ImageKit direct upload.'));
        };

        xhr.onabort = () => {
          activeXhrRef.current = null;
          reject(new Error('Upload aborted.'));
        };

        xhr.open(auth.uploadMethod || 'POST', auth.uploadUrl);
        xhr.send(formData);
      });

      // Step 3: Server-side verification & durable Firestore registration
      setUploadStage('verifying');
      const isPdf =
        uploadFile.name.toLowerCase().endsWith('.pdf') ||
        uploadFile.type === 'application/pdf' ||
        ikResponse.mime === 'application/pdf';

      const regRes = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: ikResponse.name || uploadFile.name,
          originalName: uploadFile.name,
          mimeType: ikResponse.mime || uploadFile.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
          sizeBytes: ikResponse.size || uploadFile.size,
          dimensions: isPdf
            ? undefined
            : ikResponse.width && ikResponse.height
            ? { width: ikResponse.width, height: ikResponse.height }
            : uploadDimensions || undefined,
          url: ikResponse.url,
          thumbnailUrl: isPdf ? ikResponse.url : ikResponse.thumbnailUrl || ikResponse.url,
          provider: 'imagekit',
          providerAssetId: ikResponse.fileId,
          intentToken: signData.intentToken || auth.fields?.token,
          altText: uploadAltText.trim() || uploadFile.name,
          caption: uploadCaption.trim() || undefined,
          folder: uploadFolder,
          tags: uploadTags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });

      const regData = await regRes.json();
      if (!regRes.ok || !regData.success || !regData.data) {
        throw new Error(regData.error || 'Server asset registration failed.');
      }

      // Step 4: Completion & state synchronization
      setUploadStage('done');
      const newAsset: MediaAssetEntity = regData.data;
      setAssets((prev) => [newAsset, ...prev.filter((a) => a.id !== newAsset.id)]);
      setUsageMap((prev) => ({
        ...prev,
        [newAsset.id]: {
          assetId: newAsset.id,
          isInUse: false,
          isDeletable: true,
          references: [],
          summary: 'Unused (Safe for deletion)',
        },
      }));
      handleSelectAsset(newAsset);
      setStatusMsg({
        type: 'success',
        text: `Image "${newAsset.originalName}" uploaded directly to ImageKit, verified, and saved to media library.`,
      });

      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadFile(null);
        if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
        setUploadPreviewUrl(null);
        setUploadDimensions(null);
        setUploadStage('idle');
        setUploadProgress(0);
      }, 500);
    } catch (err: unknown) {
      setUploadStage('error');
      const msg = err instanceof Error ? err.message : 'Upload process failed.';
      setUploadError(msg);
    }
  };

  const handleCloseUploadModal = () => {
    if (uploadStage === 'uploading' || uploadStage === 'signing' || uploadStage === 'verifying') {
      if (!confirm('An upload is in progress. Are you sure you want to cancel and exit?')) {
        return;
      }
      handleCancelUpload();
    }
    setIsUploadModalOpen(false);
    setUploadFile(null);
    if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
    setUploadPreviewUrl(null);
    setUploadDimensions(null);
    setUploadStage('idle');
    setUploadProgress(0);
    setUploadError(null);
  };

  // Check for orphaned ImageKit uploads
  const handleCheckOrphans = async () => {
    setIsCheckingOrphans(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/admin/media/reconcile');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed checking for orphaned uploads.');
      }
      setOrphanedAssets(data.orphanedAssets || []);
      if ((data.orphanedAssets || []).length === 0) {
        setStatusMsg({
          type: 'success',
          text: data.message || 'All ImageKit files are fully registered in the CMS. No orphaned uploads found.',
        });
      } else {
        setIsReconcileModalOpen(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query orphan uploads.';
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setIsCheckingOrphans(false);
    }
  };

  // Reconcile and save an orphaned asset
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleReconcileAsset = async (orphan: any) => {
    setReconcilingId(orphan.fileId);
    try {
      const res = await fetch('/api/admin/media/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerAssetId: orphan.fileId,
          folder: orphan.folder,
          altText: orphan.name,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.error || 'Failed to reconcile asset.');
      }

      setAssets((prev) => [data.data, ...prev.filter((a) => a.id !== data.data.id)]);
      setOrphanedAssets((prev) => prev.filter((o) => o.fileId !== orphan.fileId));
      setStatusMsg({
        type: 'success',
        text: `Orphaned asset "${data.data.filename}" reconciled and saved to media library.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reconciliation failed.';
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setReconcilingId(null);
    }
  };

  return (
    <div>
      {/* Status Alert Banner */}
      {statusMsg && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            marginBottom: '1.25rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor:
              statusMsg.type === 'success'
                ? 'rgba(52, 211, 153, 0.12)'
                : 'rgba(239, 68, 68, 0.12)',
            border:
              statusMsg.type === 'success'
                ? '1px solid rgba(52, 211, 153, 0.3)'
                : '1px solid rgba(239, 68, 68, 0.3)',
            color: statusMsg.type === 'success' ? '#34D399' : '#F87171',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{statusMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Honest Storage Provider Status Card */}
      <div
        className="admin-card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--color-gold-border, rgba(201, 164, 92, 0.25))',
          backgroundColor: 'rgba(17, 17, 22, 0.95)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              backgroundColor: 'rgba(201, 164, 92, 0.12)',
              border: '1px solid rgba(201, 164, 92, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-gold, #C9A45C)',
              flexShrink: 0,
            }}
          >
            {isUploadConfigured ? <HardDrive size={22} /> : <CloudOff size={22} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                Active Storage Pipeline:
              </span>
              <span
                style={{
                  fontSize: '0.74rem',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '4px',
                  backgroundColor: isUploadConfigured
                    ? 'rgba(52, 211, 153, 0.15)'
                    : 'rgba(234, 179, 8, 0.15)',
                  color: isUploadConfigured ? '#34D399' : '#FBBF24',
                  border: isUploadConfigured
                    ? '1px solid rgba(52, 211, 153, 0.3)'
                    : '1px solid rgba(234, 179, 8, 0.3)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                {activeProvider} ({isUploadConfigured ? 'Ready' : 'Read-Only Local Seed'})
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
              {isUploadConfigured
                ? 'Production cloud media provider is configured and accepting direct browser uploads.'
                : 'Direct uploads are blocked pending provider approval. Vercel filesystem is read-only. Local assets render reliably.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsProviderModalOpen(true)}
            className="admin-btn-outline"
            style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Info size={16} />
            <span>Provider Matrix & Readiness</span>
          </button>

          {/* Reconcile Orphaned Uploads Button */}
          {isUploadConfigured && (
            <button
              type="button"
              onClick={handleCheckOrphans}
              disabled={isCheckingOrphans}
              className="admin-btn-outline"
              style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {isCheckingOrphans ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              <span>{isCheckingOrphans ? 'Scanning...' : 'Reconcile Remote'}</span>
            </button>
          )}

          {/* Honest Upload Button */}
          {isUploadConfigured ? (
            <button
              type="button"
              onClick={() => {
                setUploadError(null);
                setIsUploadModalOpen(true);
              }}
              className="admin-btn-primary"
              style={{
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Upload size={15} />
              <span>Upload Asset</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsProviderModalOpen(true)}
              className="admin-btn-primary"
              style={{
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                opacity: 0.85,
              }}
            >
              <Lock size={15} />
              <span>Uploads Disabled (Setup Required)</span>
            </button>
          )}
        </div>
      </div>

      {/* Media Stats Grid */}
      <div
        className="admin-stat-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Managed Assets</div>
          <div className="admin-stat-value" style={{ color: 'var(--color-gold-light, #E4C88A)' }}>
            {stats.count}
          </div>
          <div className="admin-stat-sub">{stats.totalMb} MB total volume</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Actively Referenced</div>
          <div className="admin-stat-value" style={{ color: '#34D399' }}>
            {stats.inUseCount}
          </div>
          <div className="admin-stat-sub">Guarded against deletion</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Unreferenced Assets</div>
          <div className="admin-stat-value" style={{ color: 'var(--color-ivory, #F6F3EC)' }}>
            {stats.unusedCount}
          </div>
          <div className="admin-stat-sub">Safe for clean-up</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Security & Integrity</div>
          <div className="admin-stat-value" style={{ fontSize: '1.1rem', color: '#60A5FA' }}>
            Server-Signed
          </div>
          <div className="admin-stat-sub">MIME, SVG & Origin Enforced</div>
        </div>
      </div>

      {/* Main Workspace Layout: Controls + Grid/Table + Inspector Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedAsset ? '1fr 340px' : '1fr',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Toolbar + Content View */}
        <div>
          {/* Toolbar */}
          <div
            className="admin-card"
            style={{
              padding: '1rem',
              marginBottom: '1rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Search Box */}
            <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 220px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-dim, #9A9AA8)',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search filename, alt text, tags..."
                className="admin-form-input"
                style={{ paddingLeft: '2.25rem', fontSize: '0.82rem' }}
              />
            </div>

            {/* Folder Filter */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {['all', 'projects', 'articles', 'photos', 'brand', 'general'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSelectedFolder(f)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: selectedFolder === f ? 600 : 500,
                    cursor: 'pointer',
                    border:
                      selectedFolder === f
                        ? '1px solid var(--color-gold, #C9A45C)'
                        : '1px solid rgba(255, 255, 255, 0.12)',
                    backgroundColor:
                      selectedFolder === f ? 'rgba(201, 164, 92, 0.15)' : 'transparent',
                    color:
                      selectedFolder === f
                        ? 'var(--color-gold-light, #E4C88A)'
                        : 'var(--color-text-dim, #9A9AA8)',
                    textTransform: 'capitalize',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Tag Filter Dropdown */}
            {allTags.length > 0 && (
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="admin-form-input"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
                aria-label="Filter by tag"
              >
                <option value="all">All Tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    #{tag}
                  </option>
                ))}
              </select>
            )}

            {/* View Mode Toggle & Archive Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowDeleted(!showDeleted)}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  border: showDeleted
                    ? '1px solid #EF4444'
                    : '1px solid rgba(255, 255, 255, 0.12)',
                  backgroundColor: showDeleted ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                  color: showDeleted ? '#F87171' : 'var(--color-text-dim, #9A9AA8)',
                }}
              >
                {showDeleted ? 'Viewing Deleted' : 'Show Deleted'}
              </button>

              <div
                style={{
                  display: 'flex',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px',
                  padding: '2px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  style={{
                    background: viewMode === 'grid' ? 'rgba(201, 164, 92, 0.2)' : 'transparent',
                    border: 'none',
                    color: viewMode === 'grid' ? 'var(--color-gold, #C9A45C)' : 'var(--color-text-dim, #9A9AA8)',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  aria-label="List view"
                  style={{
                    background: viewMode === 'table' ? 'rgba(201, 164, 92, 0.2)' : 'transparent',
                    border: 'none',
                    color: viewMode === 'table' ? 'var(--color-gold, #C9A45C)' : 'var(--color-text-dim, #9A9AA8)',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '1rem',
              }}
            >
              {filteredAssets.length === 0 ? (
                <div
                  className="admin-card"
                  style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '3rem 1rem',
                    color: 'var(--color-text-dim, #9A9AA8)',
                  }}
                >
                  <ImageIcon size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                  <div style={{ fontSize: '1rem', fontWeight: 500 }}>No assets match your filters</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>
                    Try broadening your search or switching folder filters.
                  </div>
                </div>
              ) : (
                filteredAssets.map((asset) => {
                  const isSelected = selectedAssetId === asset.id;
                  const usage = usageMap[asset.id];
                  const isImage = asset.mimeType.startsWith('image/');

                  return (
                    <div
                      key={asset.id}
                      onClick={() => handleSelectAsset(asset)}
                      className="admin-card"
                      style={{
                        padding: 0,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: isSelected
                          ? '2px solid var(--color-gold, #C9A45C)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        backgroundColor: isSelected
                          ? 'rgba(201, 164, 92, 0.04)'
                          : 'rgba(17, 17, 22, 0.85)',
                        transition: 'transform 0.15s ease, border-color 0.15s ease',
                      }}
                    >
                      {/* Image Preview Box */}
                      <div
                        style={{
                          height: '130px',
                          position: 'relative',
                          backgroundColor: '#0a0a0d',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isImage ? (
                          <Image
                            src={asset.url}
                            alt={asset.altText || asset.filename}
                            fill
                            sizes="220px"
                            style={{ objectFit: 'cover' }}
                            unoptimized={asset.mimeType === 'image/svg+xml'}
                          />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                            <FileText size={38} style={{ color: 'var(--color-gold, #C9A45C)' }} />
                            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--color-gold-light, #E4C88A)', letterSpacing: '0.05em' }}>
                              PDF DOCUMENT
                            </span>
                          </div>
                        )}

                        {/* Top-Right Badge: Usage Status */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            fontSize: '0.65rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: usage?.isInUse
                              ? 'rgba(52, 211, 153, 0.85)'
                              : 'rgba(154, 154, 168, 0.85)',
                            color: '#0A0A0D',
                            fontWeight: 700,
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                          }}
                        >
                          {usage?.isInUse ? `${usage.references.length} in use` : 'Unused'}
                        </div>

                        {/* Bottom-Left: Folder Badge */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '6px',
                            left: '6px',
                            fontSize: '0.65rem',
                            padding: '0.12rem 0.4rem',
                            borderRadius: '3px',
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            color: 'var(--color-gold-light, #E4C88A)',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                          }}
                        >
                          {asset.folder}
                        </div>
                      </div>

                      {/* Card Meta */}
                      <div style={{ padding: '0.75rem' }}>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--color-ivory, #F6F3EC)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={asset.originalName}
                        >
                          {asset.originalName}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.7rem',
                            color: 'var(--color-text-dim, #9A9AA8)',
                            marginTop: '0.35rem',
                          }}
                        >
                          <span>{(asset.sizeBytes / 1024).toFixed(0)} KB</span>
                          {asset.dimensions ? (
                            <span style={{ fontFamily: 'monospace' }}>
                              {asset.dimensions.width}×{asset.dimensions.height}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-gold, #C9A45C)', fontWeight: 600 }}>PDF</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Table View */
            <div className="admin-table-wrapper">
              <table className="admin-table" aria-label="Media Assets">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Preview</th>
                    <th>Asset Name & Alt Text</th>
                    <th>Folder</th>
                    <th>MIME / Dimensions</th>
                    <th>Size</th>
                    <th>Usage References</th>
                    <th>Provider</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                        No assets found.
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset) => {
                      const isSelected = selectedAssetId === asset.id;
                      const usage = usageMap[asset.id];
                      const isImage = asset.mimeType.startsWith('image/');

                      return (
                        <tr
                          key={asset.id}
                          onClick={() => handleSelectAsset(asset)}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'rgba(201, 164, 92, 0.08)' : undefined,
                          }}
                        >
                          <td>
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                position: 'relative',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                backgroundColor: '#0a0a0d',
                              }}
                            >
                              {isImage ? (
                                <Image
                                  src={asset.url}
                                  alt={asset.altText || asset.filename}
                                  fill
                                  sizes="50px"
                                  style={{ objectFit: 'cover' }}
                                  unoptimized={asset.mimeType === 'image/svg+xml'}
                                />
                              ) : (
                                <FileText size={24} style={{ color: 'var(--color-gold, #C9A45C)' }} />
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', fontSize: '0.84rem' }}>
                              {asset.originalName}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                              {asset.altText || 'No alt text'}
                            </div>
                          </td>
                          <td>
                            <span className="admin-slug-pill">{asset.folder}</span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.74rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                              <div>{asset.mimeType}</div>
                              {asset.dimensions ? (
                                <div style={{ fontFamily: 'monospace', color: 'var(--color-gold-light, #E4C88A)' }}>
                                  {asset.dimensions.width} × {asset.dimensions.height}
                                </div>
                              ) : asset.mimeType === 'application/pdf' ? (
                                <div style={{ color: 'var(--color-gold, #C9A45C)', fontWeight: 600 }}>
                                  PDF Document
                                </div>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.76rem', fontFamily: 'monospace' }}>
                              {(asset.sizeBytes / 1024).toFixed(1)} KB
                            </span>
                          </td>
                          <td>
                            {usage?.isInUse ? (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(52, 211, 153, 0.15)',
                                  color: '#34D399',
                                  fontWeight: 600,
                                }}
                              >
                                {usage.references.length} reference{usage.references.length === 1 ? '' : 's'}
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  color: 'var(--color-text-dim, #9A9AA8)',
                                }}
                              >
                                Unused
                              </span>
                            )}
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '3px',
                                backgroundColor: 'rgba(201, 164, 92, 0.1)',
                                color: 'var(--color-gold, #C9A45C)',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                              }}
                            >
                              {asset.provider}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Asset Inspector Panel */}
        {selectedAsset && (
          <div
            className="admin-card"
            style={{
              position: 'sticky',
              top: '80px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              backgroundColor: 'var(--color-obsidian-soft, #111116)',
              border: '1px solid var(--color-gold-border, rgba(201, 164, 92, 0.25))',
            }}
          >
            {/* Inspector Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-gold, #C9A45C)', fontWeight: 700 }}>
                  Asset Inspector
                </span>
                <h3
                  style={{
                    margin: '0.2rem 0 0',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--color-ivory, #F6F3EC)',
                    wordBreak: 'break-all',
                  }}
                >
                  {selectedAsset.originalName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssetId(null)}
                aria-label="Close inspector"
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-dim, #9A9AA8)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Visual Preview */}
            <div
              style={{
                width: '100%',
                height: '180px',
                position: 'relative',
                borderRadius: '6px',
                overflow: 'hidden',
                backgroundColor: '#0a0a0d',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selectedAsset.mimeType.startsWith('image/') ? (
                <Image
                  src={selectedAsset.url}
                  alt={selectedAsset.altText || selectedAsset.filename}
                  fill
                  sizes="320px"
                  style={{ objectFit: 'contain' }}
                  unoptimized={selectedAsset.mimeType === 'image/svg+xml'}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem' }}>
                  <FileText size={52} style={{ color: 'var(--color-gold, #C9A45C)' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-gold-light, #E4C88A)', letterSpacing: '0.05em' }}>
                    PDF DOCUMENT
                  </span>
                  <a
                    href={selectedAsset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn-outline"
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', marginTop: '0.2rem' }}
                  >
                    Open Document
                  </a>
                </div>
              )}
            </div>

            {/* Quick URL & Copy */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                readOnly
                value={selectedAsset.url}
                className="admin-form-input"
                style={{ fontSize: '0.74rem', padding: '0.4rem 0.6rem' }}
              />
              <button
                type="button"
                onClick={() => handleCopyUrl(selectedAsset.url)}
                className="admin-btn-outline"
                style={{ padding: '0.4rem 0.65rem' }}
                title="Copy URL"
              >
                {copiedUrl ? <Check size={14} style={{ color: '#34D399' }} /> : <Copy size={14} />}
              </button>
            </div>

            {/* Technical Specifications */}
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>MIME:</span>
                <span style={{ color: 'var(--color-ivory, #F6F3EC)' }}>{selectedAsset.mimeType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>File Size:</span>
                <span style={{ color: 'var(--color-ivory, #F6F3EC)' }}>
                  {(selectedAsset.sizeBytes / 1024).toFixed(1)} KB ({selectedAsset.sizeBytes.toLocaleString()} bytes)
                </span>
              </div>
              {selectedAsset.dimensions ? (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>Dimensions:</span>
                  <span style={{ color: 'var(--color-gold-light, #E4C88A)', fontFamily: 'monospace' }}>
                    {selectedAsset.dimensions.width} × {selectedAsset.dimensions.height}
                  </span>
                </div>
              ) : selectedAsset.mimeType === 'application/pdf' ? (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>Format:</span>
                  <span style={{ color: 'var(--color-gold-light, #E4C88A)' }}>PDF Document</span>
                </div>
              ) : null}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>Provider:</span>
                <span style={{ color: 'var(--color-gold, #C9A45C)', textTransform: 'uppercase', fontWeight: 600 }}>
                  {selectedAsset.provider}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>Created:</span>
                <span style={{ color: 'var(--color-ivory, #F6F3EC)' }}>
                  {new Date(selectedAsset.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Editable Metadata Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label className="admin-form-label" style={{ fontSize: '0.75rem' }}>
                  Alt Text (Accessibility)
                </label>
                <input
                  type="text"
                  value={editAltText}
                  onChange={(e) => setEditAltText(e.target.value)}
                  className="admin-form-input"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                  placeholder="Describe image content..."
                />
              </div>

              <div>
                <label className="admin-form-label" style={{ fontSize: '0.75rem' }}>
                  Caption / Notes
                </label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="admin-form-input"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem', minHeight: '50px' }}
                  placeholder="Optional editorial caption..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label className="admin-form-label" style={{ fontSize: '0.75rem' }}>
                    Folder
                  </label>
                  <select
                    value={editFolder}
                    onChange={(e) => setEditFolder(e.target.value as MediaFolder)}
                    className="admin-form-input"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                  >
                    <option value="projects">projects</option>
                    <option value="articles">articles</option>
                    <option value="photos">photos</option>
                    <option value="brand">brand</option>
                    <option value="general">general</option>
                  </select>
                </div>

                <div>
                  <label className="admin-form-label" style={{ fontSize: '0.75rem' }}>
                    Tags (Comma-sep)
                  </label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="admin-form-input"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                    placeholder="hero, editorial..."
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveMetadata}
                disabled={isPending}
                className="admin-btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.5rem', width: '100%', justifyContent: 'center' }}
              >
                <Save size={15} />
                <span>{isPending ? 'Saving...' : 'Save Metadata'}</span>
              </button>
            </div>

            {/* Live Usage References Section */}
            <div
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                  Active Usage References
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '0.12rem 0.45rem',
                    borderRadius: '4px',
                    backgroundColor: selectedUsage?.isInUse
                      ? 'rgba(52, 211, 153, 0.15)'
                      : 'rgba(255, 255, 255, 0.08)',
                    color: selectedUsage?.isInUse ? '#34D399' : 'var(--color-text-dim, #9A9AA8)',
                    fontWeight: 600,
                  }}
                >
                  {selectedUsage?.isInUse
                    ? `${selectedUsage.references.length} Location${selectedUsage.references.length === 1 ? '' : 's'}`
                    : 'Unreferenced'}
                </span>
              </div>

              {selectedUsage && selectedUsage.references.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {selectedUsage.references.map((ref, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.45rem 0.6rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        fontSize: '0.72rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                          {ref.entityTitle}
                        </span>
                        <span style={{ color: ref.isPublished ? '#34D399' : '#FBBF24', fontSize: '0.65rem' }}>
                          {ref.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <div style={{ color: 'var(--color-text-dim, #9A9AA8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Field: {ref.fieldLabel}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReplaceTarget(ref);
                            setIsReplaceModalOpen(true);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-gold, #C9A45C)',
                            fontSize: '0.68rem',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            padding: 0,
                          }}
                        >
                          Replace...
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.74rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                  This asset is not currently referenced by any projects, articles, sections, brand settings, or SEO tags.
                </div>
              )}
            </div>

            {/* Safe Deletion / Permanent Deletion Controls */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {selectedAsset.isDeleted ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleRestoreAsset(selectedAsset.id)}
                    className="admin-btn-outline"
                    style={{ width: '100%', justifyContent: 'center', color: '#34D399', borderColor: '#34D399' }}
                  >
                    <RefreshCw size={15} />
                    <span>Restore Soft-Deleted Asset</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePermanentDeleteAsset}
                    disabled={selectedUsage?.isInUse || isPending}
                    className="admin-btn-outline"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      color: selectedUsage?.isInUse ? 'var(--color-text-dim, #9A9AA8)' : '#EF4444',
                      borderColor: selectedUsage?.isInUse ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.3)',
                      opacity: selectedUsage?.isInUse ? 0.5 : 1,
                      cursor: selectedUsage?.isInUse ? 'not-allowed' : 'pointer',
                    }}
                    title={
                      selectedUsage?.isInUse
                        ? 'Cannot permanently delete: Asset is actively referenced'
                        : 'Permanently remove from remote cloud and database'
                    }
                  >
                    <Trash2 size={15} />
                    <span>Permanently Delete Remote Asset</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleDeleteAsset}
                    disabled={selectedUsage?.isInUse || isPending}
                    className="admin-btn-outline"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      color: selectedUsage?.isInUse ? 'var(--color-text-dim, #9A9AA8)' : '#EF4444',
                      borderColor: selectedUsage?.isInUse ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.3)',
                      opacity: selectedUsage?.isInUse ? 0.5 : 1,
                      cursor: selectedUsage?.isInUse ? 'not-allowed' : 'pointer',
                    }}
                    title={
                      selectedUsage?.isInUse
                        ? 'Cannot delete: Asset is actively referenced by content'
                        : 'Soft-delete unreferenced asset'
                    }
                  >
                    <Trash2 size={15} />
                    <span>
                      {selectedUsage?.isInUse ? 'Deletion Guarded (In Use)' : 'Safe Soft Delete'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePermanentDeleteAsset}
                    disabled={selectedUsage?.isInUse || isPending}
                    className="admin-btn-outline"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      color: selectedUsage?.isInUse ? 'var(--color-text-dim, #9A9AA8)' : '#F87171',
                      borderColor: selectedUsage?.isInUse ? 'rgba(255, 255, 255, 0.08)' : 'rgba(248, 113, 113, 0.25)',
                      opacity: selectedUsage?.isInUse ? 0.4 : 0.85,
                      cursor: selectedUsage?.isInUse ? 'not-allowed' : 'pointer',
                    }}
                    title={
                      selectedUsage?.isInUse
                        ? 'Cannot permanently delete: Asset is actively referenced'
                        : 'Permanently remove from remote cloud and database'
                    }
                  >
                    <Trash2 size={13} />
                    <span>Permanently Delete from Remote Cloud</span>
                  </button>
                </>
              )}

              {selectedUsage?.isInUse && (
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.2rem', textAlign: 'center' }}>
                  To delete this asset, replace its references first.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Provider Matrix & Setup Modal */}
      {isProviderModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsProviderModalOpen(false);
          }}
        >
          <div
            className="admin-card"
            style={{
              width: '100%',
              maxWidth: '850px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--color-obsidian-soft, #111116)',
              border: '1px solid var(--color-gold-border, rgba(201, 164, 92, 0.28))',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-ivory, #F6F3EC)' }}>
                  Storage Provider Specifications & Activation Readiness
                </h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                  Phase 16E.0 Architecture Analysis for Direct Vercel-to-Cloud Uploads
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProviderModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-dim, #9A9AA8)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Notice Card */}
            <div
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'rgba(201, 164, 92, 0.08)',
                border: '1px solid rgba(201, 164, 92, 0.25)',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                fontSize: '0.82rem',
                color: 'var(--color-ivory, #F6F3EC)',
                display: 'flex',
                gap: '0.75rem',
              }}
            >
              <Info size={18} style={{ color: 'var(--color-gold, #C9A45C)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Provider Selection Pending Owner Authorization:</strong> The provider-independent upload architecture
                is fully implemented with short-lived signing endpoints and security validators. Direct uploads will activate
                immediately once provider credentials are added to environment variables (Verified Owner UID: <code>{ownerUid}</code>).
              </div>
            </div>

            {/* Provider Comparison Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {STORAGE_PROVIDER_COMPARISON.providers.map((p) => {
                const isRec = p.recommendationStatus === 'recommended';
                const isAlt = p.recommendationStatus === 'alternative';

                return (
                  <div
                    key={p.id}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      border: isRec
                        ? '1px solid var(--color-gold, #C9A45C)'
                        : isAlt
                        ? '1px solid rgba(96, 165, 250, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                          {p.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            backgroundColor: isRec
                              ? 'rgba(201, 164, 92, 0.2)'
                              : isAlt
                              ? 'rgba(96, 165, 250, 0.2)'
                              : 'rgba(239, 68, 68, 0.2)',
                            color: isRec
                              ? 'var(--color-gold, #C9A45C)'
                              : isAlt
                              ? '#60A5FA'
                              : '#F87171',
                          }}
                        >
                          {p.recommendationStatus === 'recommended'
                            ? 'Recommended'
                            : p.recommendationStatus === 'alternative'
                            ? 'Viable Alternative'
                            : 'Not Recommended for CMS'}
                        </span>
                      </div>
                    </div>

                    <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                      {p.recommendationReason}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem', fontSize: '0.72rem' }}>
                      <div>
                        <strong style={{ color: 'var(--color-ivory, #F6F3EC)' }}>Direct Browser Uploads:</strong>
                        <div style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>{p.directUploads}</div>
                      </div>
                      <div>
                        <strong style={{ color: 'var(--color-ivory, #F6F3EC)' }}>CDN & Optimization:</strong>
                        <div style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>{p.cdnAndOptimization}</div>
                      </div>
                      <div>
                        <strong style={{ color: 'var(--color-ivory, #F6F3EC)' }}>Vercel Compatibility:</strong>
                        <div style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>{p.vercelCompatibility}</div>
                      </div>
                      <div>
                        <strong style={{ color: 'var(--color-ivory, #F6F3EC)' }}>Limits & Costs:</strong>
                        <div style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>{p.limitsAndCosts}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsProviderModalOpen(false)}
                className="admin-btn-primary"
                style={{ fontSize: '0.82rem' }}
              >
                Close Provider Matrix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Replacement Modal */}
      {isReplaceModalOpen && selectedReplaceTarget && selectedAsset && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsReplaceModalOpen(false);
          }}
        >
          <div
            className="admin-card"
            style={{
              width: '100%',
              maxWidth: '600px',
              backgroundColor: 'var(--color-obsidian-soft, #111116)',
              border: '1px solid var(--color-gold-border, rgba(201, 164, 92, 0.28))',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-ivory, #F6F3EC)' }}>
                Safe Asset Replacement Workflow
              </h3>
              <button
                type="button"
                onClick={() => setIsReplaceModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-dim, #9A9AA8)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim, #9A9AA8)', marginBottom: '1rem' }}>
              Target: <strong style={{ color: 'var(--color-ivory, #F6F3EC)' }}>{selectedReplaceTarget.entityTitle}</strong>{' '}
              ({selectedReplaceTarget.fieldLabel})
            </p>

            {/* Current vs Replacement Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              {/* Current Asset */}
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim, #9A9AA8)' }}>Current Asset</span>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', margin: '0.25rem 0' }}>
                  {selectedAsset.originalName}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-gold, #C9A45C)' }}>
                  Retained until all references clear
                </div>
              </div>

              {/* Replacement Selection */}
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '6px' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--color-text-dim, #9A9AA8)', display: 'block' }}>
                  Choose Replacement Asset:
                </label>
                <select
                  value={replacementAssetId}
                  onChange={(e) => setReplacementAssetId(e.target.value)}
                  className="admin-form-input"
                  style={{ fontSize: '0.78rem', padding: '0.4rem', marginTop: '0.35rem' }}
                >
                  <option value="">-- Select Replacement Asset --</option>
                  {assets
                    .filter((a) => a.id !== selectedAsset.id && !a.isDeleted)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.originalName} ({a.folder})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsReplaceModalOpen(false)}
                className="admin-btn-outline"
                style={{ fontSize: '0.8rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReplacement}
                disabled={!replacementAssetId || isPending}
                className="admin-btn-primary"
                style={{ fontSize: '0.8rem' }}
              >
                {isPending ? 'Executing...' : 'Confirm Safe Replacement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real ImageKit Upload Modal */}
      {isUploadModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseUploadModal();
          }}
        >
          <div
            className="admin-card"
            style={{
              width: '100%',
              maxWidth: '680px',
              backgroundColor: 'var(--color-obsidian-soft, #111116)',
              border: '1px solid var(--color-gold-border, rgba(201, 164, 92, 0.28))',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(201, 164, 92, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-gold, #C9A45C)',
                  }}
                >
                  <UploadCloud size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-ivory, #F6F3EC)' }}>
                    Upload Asset to Media Library
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#34D399', fontWeight: 500 }}>
                    Direct ImageKit Browser Upload • 0 Next.js / Vercel Server Overhead
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseUploadModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-dim, #9A9AA8)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Error Banner */}
            {uploadError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  marginBottom: '1rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{uploadError}</span>
              </div>
            )}

            {/* File Selection Dropzone or Preview */}
            {!uploadFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => {
                  const input = document.getElementById('media-upload-input');
                  if (input) input.click();
                }}
                style={{
                  border: '2px dashed rgba(201, 164, 92, 0.35)',
                  borderRadius: '10px',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  transition: 'border-color 0.2s ease, background-color 0.2s ease',
                  marginBottom: '1.25rem',
                }}
              >
                <input
                  id="media-upload-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <UploadCloud
                  size={42}
                  style={{ color: 'var(--color-gold, #C9A45C)', margin: '0 auto 0.75rem' }}
                />
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '0.3rem' }}>
                  Choose a media asset (image or PDF) or drag & drop here
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim, #9A9AA8)', marginBottom: '0.6rem' }}>
                  Supported formats: <strong>JPEG, PNG, WebP, GIF</strong> (up to 15 MB) • <strong>PDF Documents</strong> (up to 10 MB)
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(201, 164, 92, 0.85)' }}>
                  File binary signatures (magic bytes) are verified before upload. Untrusted SVG and executable files are rejected.
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '1.25rem' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '140px 1fr',
                    gap: '1rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    marginBottom: '1rem',
                  }}
                >
                  {/* Left: Preview thumbnail */}
                  <div
                    style={{
                      width: '140px',
                      height: '110px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(201, 164, 92, 0.2)',
                    }}
                  >
                    {uploadPreviewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={uploadPreviewUrl}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                        <FileText size={36} style={{ color: 'var(--color-gold, #C9A45C)' }} />
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--color-gold-light, #E4C88A)' }}>
                          PDF
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Selected File Details & Switcher */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: 'var(--color-ivory, #F6F3EC)',
                          wordBreak: 'break-all',
                          marginBottom: '0.25rem',
                        }}
                      >
                        {uploadFile.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-text-dim, #9A9AA8)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span>{(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                        <span>•</span>
                        <span>{uploadFile.type === 'application/pdf' ? 'PDF Document' : uploadFile.type || 'Media Asset'}</span>
                        {uploadDimensions && (
                          <>
                            <span>•</span>
                            <span style={{ color: 'var(--color-gold, #C9A45C)' }}>
                              {uploadDimensions.width} × {uploadDimensions.height} px
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        disabled={uploadStage === 'uploading' || uploadStage === 'signing' || uploadStage === 'verifying'}
                        onClick={() => {
                          setUploadFile(null);
                          if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
                          setUploadPreviewUrl(null);
                          setUploadDimensions(null);
                        }}
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--color-gold, #C9A45C)',
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        Choose a different file
                      </button>
                    </div>
                  </div>
                </div>

                {/* Metadata Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--color-text-dim, #9A9AA8)', marginBottom: '0.3rem' }}>
                      Target Folder:
                    </label>
                    <select
                      value={uploadFolder}
                      onChange={(e) => setUploadFolder(e.target.value as MediaFolder)}
                      disabled={uploadStage === 'uploading' || uploadStage === 'signing' || uploadStage === 'verifying'}
                      className="admin-form-input"
                      style={{ fontSize: '0.8rem', padding: '0.45rem' }}
                    >
                      <option value="general">general (Default)</option>
                      <option value="projects">projects (Thumbnails & Case Studies)</option>
                      <option value="articles">articles (Blog Covers & Inline Media)</option>
                      <option value="photos">photos (Hero, About, Gallery)</option>
                      <option value="brand">brand (Logos & Brand Graphics)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--color-text-dim, #9A9AA8)', marginBottom: '0.3rem' }}>
                      Alt Text (Accessibility & SEO):
                    </label>
                    <input
                      type="text"
                      value={uploadAltText}
                      onChange={(e) => setUploadAltText(e.target.value)}
                      placeholder="Descriptive alt text"
                      disabled={uploadStage === 'uploading' || uploadStage === 'signing' || uploadStage === 'verifying'}
                      className="admin-form-input"
                      style={{ fontSize: '0.8rem', padding: '0.45rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--color-text-dim, #9A9AA8)', marginBottom: '0.3rem' }}>
                      Editorial Caption (Optional):
                    </label>
                    <input
                      type="text"
                      value={uploadCaption}
                      onChange={(e) => setUploadCaption(e.target.value)}
                      placeholder="e.g. Captured during system deployment"
                      disabled={uploadStage === 'uploading' || uploadStage === 'signing' || uploadStage === 'verifying'}
                      className="admin-form-input"
                      style={{ fontSize: '0.8rem', padding: '0.45rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--color-text-dim, #9A9AA8)', marginBottom: '0.3rem' }}>
                      Tags (Comma-separated):
                    </label>
                    <input
                      type="text"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="e.g. hero, portfolio, dark-mode"
                      disabled={uploadStage === 'uploading' || uploadStage === 'signing' || uploadStage === 'verifying'}
                      className="admin-form-input"
                      style={{ fontSize: '0.8rem', padding: '0.45rem' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Live Progress Bar & Stage Indicator */}
            {(uploadStage === 'signing' || uploadStage === 'uploading' || uploadStage === 'verifying') && (
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(201, 164, 92, 0.25)',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.4rem',
                    fontSize: '0.76rem',
                  }}
                >
                  <span style={{ color: 'var(--color-gold, #C9A45C)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Loader2 size={13} className="animate-spin" />
                    {uploadStage === 'signing' && 'Phase 1: Generating short-lived HMAC authorization token...'}
                    {uploadStage === 'uploading' && `Phase 2: Direct browser upload to ImageKit CDN (${uploadProgress}%)...`}
                    {uploadStage === 'verifying' && 'Phase 3: Verifying upload with ImageKit API & persisting in Firestore...'}
                  </span>
                  <span style={{ color: 'var(--color-ivory, #F6F3EC)', fontWeight: 600 }}>
                    {uploadStage === 'uploading' ? `${uploadProgress}%` : ''}
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div
                  style={{
                    height: '6px',
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width:
                        uploadStage === 'signing'
                          ? '15%'
                          : uploadStage === 'uploading'
                          ? `${Math.max(uploadProgress, 20)}%`
                          : '95%',
                      backgroundColor: 'var(--color-gold, #C9A45C)',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <div>
                {uploadStage === 'uploading' && (
                  <button
                    type="button"
                    onClick={handleCancelUpload}
                    className="admin-btn-outline"
                    style={{ fontSize: '0.78rem', color: '#F87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  >
                    Cancel Upload
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleCloseUploadModal}
                  disabled={uploadStage === 'uploading' || uploadStage === 'signing' || uploadStage === 'verifying'}
                  className="admin-btn-outline"
                  style={{ fontSize: '0.8rem' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleStartUpload}
                  disabled={
                    !uploadFile ||
                    uploadStage === 'uploading' ||
                    uploadStage === 'signing' ||
                    uploadStage === 'verifying'
                  }
                  className="admin-btn-primary"
                  style={{
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {uploadStage === 'signing' || uploadStage === 'uploading' || uploadStage === 'verifying' ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Start Direct Upload</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orphaned Remote Uploads Reconciliation Modal */}
      {isReconcileModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsReconcileModalOpen(false);
          }}
        >
          <div
            className="admin-card"
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--color-obsidian-soft, #111116)',
              border: '1px solid var(--color-gold-border, rgba(201, 164, 92, 0.28))',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(201, 164, 92, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-gold, #C9A45C)',
                  }}
                >
                  <RefreshCw size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-ivory, #F6F3EC)' }}>
                    Reconcile Orphaned Remote Uploads
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#FBBF24', fontWeight: 500 }}>
                    {orphanedAssets.length} unmanaged file(s) found on ImageKit without CMS metadata
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReconcileModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-dim, #9A9AA8)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim, #9A9AA8)', marginBottom: '1rem' }}>
              These files were successfully uploaded directly to ImageKit (e.g. before a browser refresh or network interruption), but were not yet persisted into Firestore. You can reconcile and register them into the Media Library below:
            </p>

            {/* Orphan List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '1.25rem',
                paddingRight: '0.25rem',
              }}
            >
              {orphanedAssets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#34D399', fontSize: '0.85rem' }}>
                  All ImageKit uploads are registered in the CMS. No orphans remaining.
                </div>
              ) : (
                orphanedAssets.map((orphan) => (
                  <div
                    key={orphan.fileId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '56px',
                          height: '46px',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          position: 'relative',
                          border: '1px solid rgba(201, 164, 92, 0.2)',
                          flexShrink: 0,
                        }}
                      >
                        {orphan.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={orphan.thumbnailUrl}
                            alt={orphan.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <ImageIcon size={20} style={{ color: 'var(--color-text-dim, #9A9AA8)' }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                          {orphan.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, #9A9AA8)', display: 'flex', gap: '0.5rem' }}>
                          <span>Folder: <code>{orphan.folder}</code></span>
                          <span>•</span>
                          <span>{(orphan.sizeBytes / 1024).toFixed(1)} KB</span>
                          {orphan.width && orphan.height && (
                            <>
                              <span>•</span>
                              <span>{orphan.width} × {orphan.height} px</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={reconcilingId === orphan.fileId}
                      onClick={() => handleReconcileAsset(orphan)}
                      className="admin-btn-primary"
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      {reconcilingId === orphan.fileId ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Importing...</span>
                        </>
                      ) : (
                        <>
                          <Check size={13} />
                          <span>Register in CMS</span>
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.85rem' }}>
              <button
                type="button"
                onClick={() => setIsReconcileModalOpen(false)}
                className="admin-btn-outline"
                style={{ fontSize: '0.8rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
