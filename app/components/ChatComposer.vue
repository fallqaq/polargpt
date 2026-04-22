<script setup lang="ts">
import {
  MAX_ATTACHMENTS_PER_MESSAGE,
  normalizeModelProvider
} from '#shared/constants/polargpt'
import {
  buildAcceptAttribute,
  formatBytes,
  validateAttachmentDescriptor
} from '#shared/utils/files'

const props = defineProps<{
  busy: boolean
}>()

const emit = defineEmits<{
  submit: []
}>()

const { t, translateError } = useUiPreferences()
const runtimeConfig = useRuntimeConfig()
const draftText = defineModel<string>('text', { default: '' })
const draftFiles = defineModel<File[]>('files', { default: () => [] })
const localError = ref<string | null>(null)
const provider = computed(() => normalizeModelProvider(runtimeConfig.public.aiProvider))
const acceptAttribute = computed(() => buildAcceptAttribute(provider.value))

const canSubmit = computed(() => !props.busy && (draftText.value.trim().length > 0 || draftFiles.value.length > 0))

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])

  if (draftFiles.value.length + files.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    localError.value = t('errorTooManyAttachments', {
      count: MAX_ATTACHMENTS_PER_MESSAGE
    })
    input.value = ''
    return
  }

  const nextFiles = [...draftFiles.value]

  for (const file of files) {
    const validation = validateAttachmentDescriptor({
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size
    }, provider.value)

    if (!validation.valid) {
      localError.value = translateError(validation.reason, 'errorAttachmentValidationFailed')
      input.value = ''
      return
    }

    nextFiles.push(file)
  }

  draftFiles.value = nextFiles
  localError.value = null
  input.value = ''
}

function removeFile(index: number) {
  draftFiles.value = draftFiles.value.filter((_, itemIndex) => itemIndex !== index)
}

function submit() {
  if (props.busy) {
    return
  }

  emit('submit')
}
</script>

<template>
  <div class="composer">
    <textarea
      v-model="draftText"
      class="textarea-input composer__textarea"
      :placeholder="t('composerPlaceholder')"
      :disabled="props.busy"
      @keydown.meta.enter.prevent="submit"
      @keydown.ctrl.enter.prevent="submit"
    />

    <div v-if="draftFiles.length > 0" class="composer__files">
      <article v-for="(file, index) in draftFiles" :key="`${file.name}-${index}`" class="composer__file">
        <div class="composer__file-copy">
          <strong>{{ file.name }}</strong>
          <p>{{ file.type || t('composerUnknownType') }} · {{ formatBytes(file.size) }}</p>
        </div>

        <button type="button" class="composer__remove" @click="removeFile(index)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 9l6 6M15 9l-6 6" />
          </svg>
          <span class="sr-only">{{ t('composerRemove') }}</span>
        </button>
      </article>
    </div>

    <p v-if="localError" class="status-banner">
      {{ localError }}
    </p>

    <div class="composer__actions">
      <p class="composer__hint">{{ t('composerHint', { count: MAX_ATTACHMENTS_PER_MESSAGE }) }}</p>

      <div class="composer__controls">
        <label class="button button--ghost composer__upload">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 16V5m0 0l-4 4m4-4l4 4M5 19h14" />
          </svg>
          <span>{{ t('composerAttachFiles') }}</span>
          <input
            class="sr-only"
            type="file"
            :accept="acceptAttribute"
            multiple
            @change="onFileChange"
          >
        </label>

        <button
          class="button composer__submit"
          type="button"
          :disabled="!canSubmit"
          @click="submit"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14m0 0l-5-5m5 5l-5 5" />
          </svg>
          <span>{{ props.busy ? t('composerSubmitBusy') : t('composerSubmitIdle') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.composer {
  display: grid;
  gap: 12px;
  width: 100%;
  padding: 14px 14px 12px;
  border: 1px solid color-mix(in srgb, var(--color-border-strong) 82%, transparent);
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), transparent 38%),
    color-mix(in srgb, var(--color-panel-strong) 72%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 16px 36px rgba(92, 114, 156, 0.12);
  backdrop-filter: blur(22px) saturate(132%);
  -webkit-backdrop-filter: blur(22px) saturate(132%);
  transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
}

.composer:focus-within {
  border-color: var(--color-input-border-focus);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), transparent 36%),
    color-mix(in srgb, var(--color-panel-solid) 76%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 0 0 4px rgba(75, 129, 230, 0.05),
    0 18px 40px rgba(96, 117, 157, 0.14);
}

html[data-theme='dark'] .composer {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 32%),
    color-mix(in srgb, var(--color-panel-strong) 86%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 18px 48px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(22px) saturate(115%);
  -webkit-backdrop-filter: blur(22px) saturate(115%);
}

html[data-theme='dark'] .composer:focus-within {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 30%),
    color-mix(in srgb, var(--color-panel-solid) 88%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 4px rgba(140, 167, 232, 0.07),
    0 22px 54px rgba(0, 0, 0, 0.34);
}

.composer__upload,
.composer__submit {
  min-height: 38px;
  padding-inline: 13px;
  font-size: 0.78rem;
}

.composer__upload {
  flex-shrink: 0;
  box-shadow: none;
}

.composer__upload:hover,
.composer__upload:focus-visible {
  box-shadow: none;
}

.composer__submit {
  box-shadow:
    0 8px 16px rgba(75, 129, 230, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

html[data-theme='dark'] .composer__submit {
  box-shadow:
    0 12px 24px rgba(63, 85, 138, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
}

.composer__upload svg,
.composer__submit svg,
.composer__remove svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.composer__textarea {
  min-height: 120px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

.composer__textarea:focus {
  box-shadow: none;
}

.composer__files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.composer__file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: min(18rem, 100%);
  padding: 10px 11px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: color-mix(in srgb, var(--color-surface-soft) 80%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
}

html[data-theme='dark'] .composer__file {
  background: color-mix(in srgb, var(--color-surface-strong) 76%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.composer__file-copy {
  min-width: 0;
}

.composer__file-copy strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.composer__file-copy p {
  margin: 5px 0 0;
  color: var(--color-muted);
  font-size: 0.8rem;
}

.composer__remove {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-muted);
  transition: background 180ms ease, transform 180ms ease;
}

html[data-theme='dark'] .composer__remove {
  background: rgba(255, 255, 255, 0.04);
}

.composer__remove:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: translateY(-1px);
}

html[data-theme='dark'] .composer__remove:hover {
  background: rgba(255, 255, 255, 0.08);
}

.composer__actions {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid color-mix(in srgb, var(--color-border) 84%, transparent);
}

.composer__controls {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.composer__hint {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.76rem;
  line-height: 1.6;
}

@media (max-width: 760px) {
  .composer {
    padding: 13px 13px 11px;
  }

  .composer__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .composer__controls {
    width: 100%;
    flex-direction: column;
  }

  .composer__upload,
  .composer__submit {
    width: 100%;
  }
}
</style>
