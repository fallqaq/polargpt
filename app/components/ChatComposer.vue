<script setup lang="ts">
import { ACCEPT_ATTRIBUTE, MAX_ATTACHMENTS_PER_MESSAGE } from '#shared/constants/polargpt'
import { formatBytes, validateAttachmentDescriptor } from '#shared/utils/files'

const props = defineProps<{
  busy: boolean
}>()

const emit = defineEmits<{
  submit: []
}>()

const { t, translateError } = useUiPreferences()
const draftText = defineModel<string>('text', { default: '' })
const draftFiles = defineModel<File[]>('files', { default: () => [] })
const localError = ref<string | null>(null)

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
    })

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
  <div class="composer panel">
    <div class="composer__head">
      <div>
        <p class="surface-label">{{ t('composerPromptLabel') }}</p>
        <h3>{{ t('composerTitle') }}</h3>
      </div>

      <label class="button button--ghost composer__upload">
        {{ t('composerAttachFiles') }}
        <input
          class="sr-only"
          type="file"
          :accept="ACCEPT_ATTRIBUTE"
          multiple
          @change="onFileChange"
        >
      </label>
    </div>

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
        <div>
          <strong>{{ file.name }}</strong>
          <p>{{ file.type || t('composerUnknownType') }} · {{ formatBytes(file.size) }}</p>
        </div>
        <button type="button" @click="removeFile(index)">{{ t('composerRemove') }}</button>
      </article>
    </div>

    <p v-if="localError" class="status-banner">
      {{ localError }}
    </p>

    <div class="composer__actions">
      <p class="composer__hint">
        {{ t('composerHint', { count: MAX_ATTACHMENTS_PER_MESSAGE }) }}
      </p>
      <button
        class="button composer__submit"
        type="button"
        :disabled="props.busy || (!draftText.trim() && draftFiles.length === 0)"
        @click="submit"
      >
        {{ props.busy ? t('composerSubmitBusy') : t('composerSubmitIdle') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.composer {
  display: grid;
  gap: 16px;
  width: min(100%, 1020px);
  margin: 0 auto;
  padding: 16px;
  border-radius: 32px;
}

.composer__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.composer__head h3 {
  margin: 8px 0 0;
  font-size: 1.05rem;
  line-height: 1.25;
}

.composer__upload,
.composer__submit {
  min-height: 40px;
  padding-inline: 14px;
  font-size: 0.84rem;
}

.composer__upload {
  flex-shrink: 0;
}

.composer__textarea {
  min-height: 150px;
  border-radius: 28px;
}

.composer__files {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.composer__file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: min(18rem, 100%);
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface-soft);
}

.composer__file p {
  margin: 6px 0 0;
  color: var(--color-muted);
  font-size: 0.82rem;
}

.composer__file button {
  border: 0;
  background: transparent;
  color: var(--color-signal);
  font-size: 0.82rem;
}

.composer__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.composer__hint {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.78rem;
  font-family: var(--font-mono);
}

@media (max-width: 760px) {
  .composer {
    border-radius: 28px;
    padding: 14px;
  }

  .composer__head,
  .composer__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .composer__upload,
  .composer__submit {
    width: 100%;
  }
}
</style>
