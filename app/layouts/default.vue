<template>
  <div class="shell">
    <div class="shell__backdrop" aria-hidden="true">
      <div class="shell__mesh shell__mesh--warm" />
      <div class="shell__mesh shell__mesh--cool" />
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
  isolation: isolate;
}

.shell__backdrop {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.shell__viewport {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 10px;
  min-height: 100vh;
  max-width: 1600px;
  margin: 0 auto;
  padding: clamp(10px, 1.5vw, 18px);
}

.shell__toolbar {
  display: flex;
  justify-content: flex-end;
  position: sticky;
  top: 10px;
  z-index: 3;
}

.shell__content {
  min-height: 0;
  display: grid;
}

.shell__mesh {
  position: absolute;
  width: 42rem;
  height: 42rem;
  border-radius: 999px;
  filter: blur(88px);
  opacity: 0.62;
}

.shell__mesh--warm {
  top: -16rem;
  left: -12rem;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), transparent 24%),
    radial-gradient(circle, var(--color-glow-signal) 0%, transparent 62%);
}

.shell__mesh--cool {
  right: -12rem;
  bottom: -16rem;
  background:
    radial-gradient(circle at 42% 44%, rgba(255, 255, 255, 0.34), transparent 22%),
    radial-gradient(circle, var(--color-glow-ice) 0%, transparent 60%);
}

.shell__veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 22%),
    radial-gradient(circle at top, rgba(255, 255, 255, 0.06), transparent 26%);
}

html[data-theme='dark'] .shell__mesh {
  filter: blur(104px);
  opacity: 0.42;
}

html[data-theme='dark'] .shell__mesh--warm {
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.06), transparent 24%),
    radial-gradient(circle, var(--color-glow-signal) 0%, transparent 68%);
}

html[data-theme='dark'] .shell__mesh--cool {
  background:
    radial-gradient(circle at 42% 44%, rgba(255, 255, 255, 0.04), transparent 22%),
    radial-gradient(circle, var(--color-glow-ice) 0%, transparent 66%);
}

html[data-theme='dark'] .shell__veil {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 20%),
    radial-gradient(circle at top, rgba(108, 130, 173, 0.08), transparent 30%);
}

@media (max-width: 768px) {
  .shell__viewport {
    gap: 10px;
    padding: 10px;
  }

  .shell__toolbar {
    justify-content: stretch;
  }
}
</style>
