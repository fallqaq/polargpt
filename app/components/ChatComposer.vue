<script setup lang="ts">
import { ACCEPT_ATTRIBUTE, MAX_ATTACHMENTS_PER_MESSAGE } from '#shared/constants/polargpt'
import { formatBytes, validateAttachmentDescriptor } from '#shared/utils/files'

const props = defineProps<{
  busy: boolean
}>()

const emit = defineEmits<{
  submit: []
}>()

const draftText = defineModel<string>('text', { default: '' })
const draftFiles = defineModel<File[]>('files', { default: () => [] })
const localError = ref<string | null>(null)

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])

  if (draftFiles.value.length + files.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    localError.value = `You can upload up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`
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
      localError.value = validation.reason ?? 'Unsupported attachment.'
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
    <div class="composer__top">
      <div>
        <p class="surface-label">Prompt</p>
        <h3>Attach context, then ask directly.</h3>
      </div>
      <label class="button button--ghost composer__upload">
        Attach Files
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
      class="textarea-input"
      placeholder="Ask a question, add instructions, or describe what to do with the files..."
      :disabled="props.busy"
      @keydown.meta.enter.prevent="submit"
      @keydown.ctrl.enter.prevent="submit"
    />

    <div v-if="draftFiles.length > 0" class="composer__files">
      <article v-for="(file, index) in draftFiles" :key="`${file.name}-${index}`" class="composer__file">
        <div>
          <strong>{{ file.name }}</strong>
          <p>{{ file.type || 'Unknown type' }} · {{ formatBytes(file.size) }}</p>
        </div>
        <button type="button" @click="removeFile(index)">
          Remove
        </button>
      </article>
    </div>

    <p v-if="localError" class="status-banner">
      {{ localError }}
    </p>

    <div class="composer__actions">
      <p class="composer__hint">
        `Cmd/Ctrl + Enter` to send. Up to {{ MAX_ATTACHMENTS_PER_MESSAGE }} attachments per message.
      </p>
      <button
        class="button"
        type="button"
        :disabled="props.busy || (!draftText.trim() && draftFiles.length === 0)"
        @click="submit"
      >
        {{ props.busy ? 'Sending...' : 'Send Message' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.composer {
  display: grid;
  gap: 18px;
  padding: 20px;
}

.composer__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.composer__top h3 {
  margin: 10px 0 0;
  font-size: 1.2rem;
}

.composer__upload {
  flex-shrink: 0;
}

.composer__files {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.composer__file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: min(18rem, 100%);
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
}

.composer__file p {
  margin: 6px 0 0;
  color: var(--color-muted);
  font-size: 0.85rem;
}

.composer__file button {
  border: 0;
  background: transparent;
  color: #ffc8a8;
}

.composer__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.composer__hint {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.86rem;
  font-family: var(--font-mono);
}

@media (max-width: 760px) {
  .composer__top,
  .composer__actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
