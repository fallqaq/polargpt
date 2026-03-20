<template>
  <div class="shell">
    <div class="shell__glow shell__glow--signal" />
    <div class="shell__glow shell__glow--ice" />
    <main class="shell__viewport">
      <slot />
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
  min-height: 100vh;
  padding: 24px;
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
  background: rgba(249, 115, 22, 0.18);
}

.shell__glow--ice {
  right: -12rem;
  bottom: -14rem;
  background: rgba(59, 130, 246, 0.16);
}

@media (max-width: 768px) {
  .shell__viewport {
    padding: 16px;
  }
}
</style>
