<template>
  <div class="shell">
    <div class="shell__backdrop" aria-hidden="true">
      <div class="shell__mesh shell__mesh--warm" />
      <div class="shell__mesh shell__mesh--cool" />
      <div class="shell__mesh shell__mesh--halo" />
      <div class="shell__veil" />
    </div>
    <main class="shell__viewport">
      <div class="shell__toolbar">
        <ShellToolbar />
      </div>
      <div class="shell__content">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.shell {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.shell__backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.shell__viewport {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 20px;
  min-height: 100vh;
  padding: 24px;
}

.shell__toolbar {
  display: flex;
  justify-content: flex-end;
  padding-inline: clamp(4px, 1vw, 12px);
}

.shell__content {
  min-height: 0;
  display: grid;
  padding-inline: clamp(4px, 1vw, 12px);
}

.shell__mesh {
  position: absolute;
  width: 44rem;
  height: 44rem;
  border-radius: 999px;
  filter: blur(84px);
  opacity: 0.8;
}

.shell__mesh--warm {
  top: -14rem;
  left: -10rem;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.62), transparent 24%),
    radial-gradient(circle, var(--color-glow-signal) 0%, transparent 66%);
}

.shell__mesh--cool {
  right: -12rem;
  bottom: -16rem;
  background:
    radial-gradient(circle at 42% 44%, rgba(255, 255, 255, 0.58), transparent 22%),
    radial-gradient(circle, var(--color-glow-ice) 0%, transparent 64%);
}

.shell__mesh--halo {
  top: 18%;
  left: 46%;
  width: 34rem;
  height: 34rem;
  background:
    radial-gradient(circle at center, rgba(255, 255, 255, 0.32), transparent 30%),
    radial-gradient(circle, var(--color-glow-halo) 0%, transparent 72%);
  transform: translateX(-50%);
}

.shell__veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 20%),
    radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 28%);
}

@media (max-width: 768px) {
  .shell__viewport {
    gap: 14px;
    padding: 14px;
  }

  .shell__content,
  .shell__toolbar {
    padding-inline: 0;
  }
}
</style>
