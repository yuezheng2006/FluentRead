<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import BrowserGlyph from './BrowserGlyph.vue'
defineProps<{ en?: boolean; showDocs?: boolean }>()
const menu = ref<HTMLDetailsElement | null>(null)
function outside(event: MouseEvent) {
  if (event.target instanceof Node && !menu.value?.contains(event.target) && menu.value)
    menu.value.open = false
}
function escape(event: KeyboardEvent) {
  if (event.key === 'Escape' && menu.value?.open) {
    menu.value.open = false
    menu.value.querySelector('summary')?.focus()
  }
}
onMounted(() => {
  document.addEventListener('click', outside)
  document.addEventListener('keydown', escape)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', outside)
  document.removeEventListener('keydown', escape)
})
</script>
<template>
  <div class="bv-install">
    <div class="bv-install-actions">
      <a
        class="bv-button bv-primary"
        :href="withBase((en ? '/en' : '') + '/start')"
      >
        {{ en ? 'Start here' : '开始安装' }} <span aria-hidden="true">→</span>
      </a>
      <details ref="menu" class="bv-browser-menu">
        <summary class="bv-button bv-secondary">
          <span class="bv-browser-pair"
            ><BrowserGlyph browser="Edge" /><BrowserGlyph browser="Firefox"
          /></span>
          {{ en ? 'Store links' : '直接去商店' }}
          <svg class="bv-menu-chevron" viewBox="0 0 16 16" aria-hidden="true">
            <path d="m4 6 4 4 4-4" />
          </svg>
        </summary>
        <div class="bv-browser-options">
          <a
            href="https://chromewebstore.google.com/detail/djnlaiohfaaifbibleebjggkghlmcpcj"
            target="_blank"
            rel="noopener noreferrer"
            ><BrowserGlyph browser="Chrome" /><span>Chrome</span><span aria-hidden="true">↗</span></a
          >
          <a
            href="https://microsoftedge.microsoft.com/addons/detail/kakgmllfpjldjhcnkghpplmlbnmcoflp"
            target="_blank"
            rel="noopener noreferrer"
            ><BrowserGlyph browser="Edge" /><span>Microsoft Edge</span
            ><span aria-hidden="true">↗</span></a
          >
          <a
            href="https://addons.mozilla.org/firefox/addon/%E6%B5%81%E7%95%85%E9%98%85%E8%AF%BB/"
            target="_blank"
            rel="noopener noreferrer"
            ><BrowserGlyph browser="Firefox" /><span>Firefox</span
            ><span aria-hidden="true">↗</span></a
          >
          <a class="bv-platform-guide" :href="withBase((en ? '/en' : '') + '/guide/getting-started')"
            >{{ en ? 'More installation options' : '更多安装方式'
            }}<span aria-hidden="true">→</span></a
          >
        </div>
      </details>
      <a
        v-if="showDocs"
        class="bv-button bv-secondary bv-docs-link"
        :href="withBase((en ? '/en' : '') + '/docs/')"
        >{{ en ? 'Documentation' : '使用文档' }}</a
      >
    </div>
    <p class="fr-install-start">{{ en ? 'New to extensions? We’ll walk you through it.' : '第一次装插件也没关系，跟着向导一步一步来。' }}</p>
    <div class="bv-install-fallbacks">
      <span>{{ en ? 'Can’t open the Chrome Web Store?' : 'Chrome 商店打不开？' }}</span>
      <div class="bv-install-fallback-links">
        <a
          href="https://www.crxsoso.com/webstore/detail/djnlaiohfaaifbibleebjggkghlmcpcj"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ en ? 'CRXSOso' : 'CRX搜搜' }}
          <span v-if="!en" class="bv-domestic-badge">国内可用</span>
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="https://github.com/FluentRead/FluentRead/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ en ? 'Offline download' : '离线下载' }}
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fr-install-start { margin: 12px 0; font-size: 13px; color: var(--vp-c-text-2); }
</style>
