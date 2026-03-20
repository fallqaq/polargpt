<template>
  <div class="shell">
    <div class="shell__glow shell__glow--signal" />
    <div class="shell__glow shell__glow--ice" />
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

.shell__viewport {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 16px;
  min-height: 100vh;
  padding: 24px;
}

.shell__toolbar {
  display: flex;
  justify-content: flex-end;
}

.shell__content {
  min-height: 0;
  display: grid;
}

.shell__glow {
  position: absolute;
  width: 38rem;
  height: 38rem;
  border-radius: 999px;
  filter: blur(90px);
  opacity: 0.45;
}

.shell__glow--signal {
  top: -12rem;
  left: -12rem;
  background: var(--color-glow-signal);
}

.shell__glow--ice {
  right: -12rem;
  bottom: -14rem;
  background: var(--color-glow-ice);
}

@media (max-width: 768px) {
  .shell__viewport {
    padding: 16px;
  }
}
</style>
