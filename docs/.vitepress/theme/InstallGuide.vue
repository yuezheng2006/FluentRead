<!-- 新手安装向导：手动确认安装、固定图标与首次翻译；设备识别仅用于建议，不探测安装状态或申请权限。 -->
<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps<{ en?: boolean }>()
const t = (zh: string, en: string) => props.en ? en : zh
type Browser = 'Chrome' | 'Edge' | 'Firefox' | 'Safari' | 'Mobile' | 'Other'
const browser = ref<Browser>('Chrome')
const step = ref(1)
const complete = ref(false)
const title = ref<HTMLElement | null>(null)
const guide = (path: string) => withBase(`${props.en ? '/en' : ''}/guide/${path}`)
const stores = {
  Chrome: 'https://chromewebstore.google.com/detail/djnlaiohfaaifbibleebjggkghlmcpcj',
  Edge: 'https://microsoftedge.microsoft.com/addons/detail/kakgmllfpjldjhcnkghpplmlbnmcoflp',
  Firefox: 'https://addons.mozilla.org/firefox/addon/%E6%B5%81%E7%95%85%E9%98%85%E8%AF%BB/',
}
const store = computed(() => browser.value in stores ? stores[browser.value as keyof typeof stores] : null)
const stages = computed(() => [t('安装', 'Install'), t('找到图标', 'Find icon'), t('翻译一页', 'Translate')])
const heading = computed(() => complete.value
  ? t('下一篇，读你感兴趣的。', 'Now read something you love.')
  : [t('先把流畅阅读装进浏览器。', 'First, add FluentRead to your browser.'),
    t('让翻译按钮，随时找得到。', 'Keep translation within reach.'),
    t('打开练习页，试试第一段翻译。', 'Try translating your first paragraph.')][step.value - 1])

async function go(next: number) {
  step.value = next
  complete.value = false
  await nextTick()
  title.value?.focus()
}
function changeBrowser() {
  step.value = 1
  complete.value = false
}
async function finish() {
  complete.value = true
  await nextTick()
  title.value?.focus()
}
onMounted(() => {
  // UA 只能建议入口；不记录、不联网、不将点击商店视作安装完成。
  const ua = navigator.userAgent
  if (/Android|iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) browser.value = 'Mobile'
  else if (/Edg\//.test(ua)) browser.value = 'Edge'
  else if (/Firefox\//.test(ua)) browser.value = 'Firefox'
  else if (/Chrome\//.test(ua)) browser.value = 'Chrome'
  else if (/Safari\//.test(ua)) browser.value = 'Safari'
  else browser.value = 'Other'
})
</script>

<template>
  <section class="fr-install-guide" :aria-label="t('新手安装向导', 'Installation walkthrough')">
    <header class="fr-install-intro">
      <p class="fr-install-eyebrow">{{ t('流畅阅读 / 第一次使用', 'FLUENTREAD / START HERE') }}</p>
      <h1>{{ t('外语网页，也能轻松读。', 'A new language. A familiar page.') }}</h1>
      <p>{{ t('从安装到第一段译文，一步一步来。先用免费翻译服务，不用填写 API 密钥。', 'From installation to your first translation, one step at a time. Start with the free translation service, without an API key.') }}</p>
    </header>

    <div class="fr-install-device">
      <label for="fr-install-browser">{{ t('你准备在哪个浏览器使用？', 'Which browser will you use?') }}</label>
      <select id="fr-install-browser" v-model="browser" @change="changeBrowser">
        <option value="Chrome">Chrome</option>
        <option value="Edge">Microsoft Edge</option>
        <option value="Firefox">Firefox</option>
        <option value="Safari">Safari</option>
        <option value="Mobile">{{ t('手机 / 平板', 'Phone / tablet') }}</option>
        <option value="Other">{{ t('其他 / 我不确定', 'Other / not sure') }}</option>
      </select>
      <p>{{ t('已按设备建议入口，也可以自己修改。请用选中的浏览器打开商店链接。', 'The suggested browser can be changed. Open the store link in the browser you choose.') }}</p>
    </div>

    <template v-if="store">
      <nav :aria-label="t('安装步骤', 'Installation steps')">
        <ol class="fr-install-progress">
          <li v-for="(stage, index) in stages" :key="stage">
            <button type="button" :aria-current="step === index + 1 ? 'step' : undefined" @click="go(index + 1)">
              <span>{{ String(index + 1).padStart(2, '0') }}</span>{{ stage }}
            </button>
          </li>
        </ol>
      </nav>
      <section class="fr-install-task" :aria-label="stages[step - 1]">
        <p class="fr-install-eyebrow">{{ complete ? t('练习完成', 'PRACTICE COMPLETE') : `${t('第', 'STEP ')} ${step} / 3` }}</p>
        <h2 ref="title" tabindex="-1">{{ heading }}</h2>
        <template v-if="complete">
          <p>{{ t('回到你想读的文章，点击流畅阅读，选择“翻译”。想看回原文，再点“还原”。', 'Open an article you want to read, click FluentRead, and choose Translate. Choose Restore to see the original again.') }}</p>
          <a class="fr-install-primary" :href="guide('webpage-translation')">{{ t('看看还能怎么读', 'Explore reading tools') }} <span aria-hidden="true">→</span></a>
          <button class="fr-install-text" type="button" @click="go(1)">{{ t('重新看安装步骤', 'Review the steps') }}</button>
        </template>
        <template v-else-if="step === 1">
          <p>{{ t('点击下面的按钮，商店会在新标签页打开。', 'The button below opens the store in a new tab.') }}</p>
          <ol class="fr-install-instructions">
            <li>{{ browser === 'Chrome' ? t('点击“添加至 Chrome”。', 'Click “Add to Chrome”.') : browser === 'Edge' ? t('点击“获取”。', 'Click “Get”.') : t('点击“添加到 Firefox”。', 'Click “Add to Firefox”.') }}</li>
            <li>{{ t('阅读浏览器弹出的权限提示，确认后添加扩展。', 'Review the browser’s permissions prompt, then confirm to add the extension.') }}</li>
            <li>{{ t('安装完成后，回到这个标签页继续。', 'After installation, return to this tab to continue.') }}</li>
          </ol>
          <a class="fr-install-primary" :href="store" target="_blank" rel="noopener noreferrer">{{ t(`去 ${browser} 商店安装`, `Open ${browser} store`) }} <span aria-hidden="true">↗</span></a>
          <p class="fr-install-note">{{ t('当前商店链接安装的是 FluentRead 上游正式版。', 'These store links install the upstream FluentRead release.') }}</p>
          <button class="fr-install-next" type="button" @click="go(2)">{{ t('我已安装，下一步', 'I installed it. Next') }} <span aria-hidden="true">→</span></button>
        </template>
        <template v-else-if="step === 2">
          <ol class="fr-install-instructions">
            <li>{{ t('看地址栏右侧，打开拼图形状的“扩展程序”菜单。', 'Open the puzzle-shaped Extensions menu beside the address bar.') }}</li>
            <li>{{ browser === 'Firefox' ? t('找到“流畅阅读”，在其设置菜单中选择固定到工具栏。', 'Find FluentRead and use its settings menu to pin it to the toolbar.') : t('找到“流畅阅读”，点击旁边的固定图标，让它出现在工具栏。', 'Find FluentRead and use the pin control to keep it in the toolbar.') }}</li>
            <li>{{ t('点击流畅阅读图标。如果提示选择界面语言，选好后确认。', 'Click FluentRead. If asked, choose and confirm your interface language.') }}</li>
          </ol>
          <p>{{ t('找不到图标？先在扩展程序菜单里查找“流畅阅读”，确认它已启用。各浏览器的固定按钮位置可能不同。', 'Can’t find it? Look for FluentRead in Extensions and check that it is enabled. Pin controls vary by browser.') }}</p>
          <a class="fr-install-text" :href="guide('getting-started') + (en ? '#pin-the-extension' : '#固定扩展图标')" target="_blank" rel="noopener noreferrer">{{ t('看固定图标的操作演示', 'See the pinning walkthrough') }} ↗</a>
          <button class="fr-install-primary" type="button" @click="go(3)">{{ t('找到图标了，去试试', 'Found it. Let’s try') }} <span aria-hidden="true">→</span></button>
        </template>
        <template v-else>
          <ol class="fr-install-instructions">
            <li>{{ t('打开下面的英文练习页。安装前已打开的网页需要先刷新。', 'Open the English practice page below. Refresh any page opened before installation.') }}</li>
            <li>{{ t('点击流畅阅读图标，目标语言选“简体中文”，翻译服务保留“免费翻译服务”。', 'Click FluentRead, choose your target language, and keep the free translation service.') }}</li>
            <li>{{ t('点击“翻译”，看到原文下方出现译文后，回到这里。', 'Click Translate. When translations appear below the original, return here.') }}</li>
          </ol>
          <a class="fr-install-primary" :href="guide('translation-playground')" target="_blank" rel="noopener noreferrer">{{ t('打开英文练习页', 'Open practice page') }} <span aria-hidden="true">↗</span></a>
          <button class="fr-install-next" type="button" @click="finish">{{ t('我看到了译文', 'I can see the translation') }} <span aria-hidden="true">→</span></button>
          <p class="fr-install-note">{{ t('网页没有变化？先刷新，再检查扩展是否启用。浏览器设置页和商店页面不能翻译。', 'Nothing changed? Refresh and check the extension is enabled. Browser settings and store pages cannot be translated.') }} <a :href="guide('faq')">{{ t('继续排查', 'Troubleshoot') }}</a></p>
        </template>
        <p class="fr-install-note">{{ t('步骤由你确认，本页面不会检测或自动安装扩展。', 'You confirm each step. This page does not detect or automatically install extensions.') }}</p>
      </section>
      <details class="fr-install-help">
        <summary>{{ t('商店打不开，或无法安装？', 'Store unavailable, or can’t install?') }}</summary>
        <p>{{ t('正在用 Chrome？如果电脑上也有 Edge，可以在上方选择 Edge，并在 Edge 中打开对应商店。公司或学校管理的浏览器可能需要管理员允许安装。', 'Using Chrome? If you also have Edge, select it above and open its store in Edge. Managed work or school browsers may require administrator approval.') }}</p>
        <a :href="guide('offline-install')">{{ t('查看离线安装步骤（需要手动操作）', 'Offline installation (manual steps)') }} →</a>
      </details>
    </template>
    <section v-else class="fr-install-task">
      <h2>{{ browser === 'Other' ? t('先找到适合你的安装方式。', 'Find the right installation path.') : t('这台设备，需要不同的安装方式。', 'This device needs a different installation path.') }}</h2>
      <p>{{ t('手机、平板和 Safari 的安装方式与电脑 Chrome 不同。不要下载电脑扩展 ZIP 后直接在手机上打开。', 'Phones, tablets, and Safari use different installation methods from desktop Chrome. A desktop extension ZIP cannot be installed directly on a phone.') }}</p>
      <p v-if="browser === 'Other'">{{ t('不确定浏览器名称？在浏览器菜单的“关于”中查看，或用电脑上的 Chrome、Edge、Firefox 打开本页。', 'Not sure which browser you use? Check About in its menu, or open this page in desktop Chrome, Edge, or Firefox.') }}</p>
      <a class="fr-install-primary" :href="guide('mobile-safari')">{{ t('查看手机与 Safari 安装方式', 'Phone and Safari options') }} →</a>
      <a class="fr-install-text" :href="guide('getting-started')">{{ t('查看全部使用说明', 'Read the full guide') }}</a>
    </section>
  </section>
</template>

<style scoped>
/* Hallmark · component: installation guide · genre: modern-minimal · theme: existing FluentRead
 * Pre-emit critique: P4 H4 E4 S5 R5 V4. Typography and brand tokens reuse the host site. */
.fr-install-guide { --install-space: 24px; max-width: 880px; margin: 0 auto; padding: 64px 24px 80px; color: var(--fr-ink); }
.fr-install-intro { margin-bottom: 40px; max-width: 720px; }
.fr-install-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: .1em; color: var(--vp-c-brand-1); margin: 0 0 16px; }
h1 { font-size: clamp(32px, 5vw, 52px); line-height: 1.15; letter-spacing: -.035em; font-weight: 750; margin: 0 0 24px; }
h1, h2 { overflow-wrap: anywhere; min-width: 0; font-style: normal; }
h2 { font-size: clamp(24px, 3vw, 32px); line-height: 1.35; margin: 0 0 20px; font-weight: 700; }
p, li { line-height: 1.8; }
p { margin: 12px 0; }
.fr-install-intro > p:last-child, .fr-install-device p, .fr-install-note { color: var(--vp-c-text-2); }
.fr-install-device { padding: var(--install-space) 0; border-top: 1px solid var(--fr-line); }
label { display: block; font-weight: 650; margin-bottom: 12px; }
select { appearance: auto; font: inherit; color: var(--fr-ink); background: var(--fr-paper); border: 1px solid var(--fr-muted); border-radius: 6px; padding: 10px 16px; width: 100%; max-width: 320px; }
.fr-install-device p, .fr-install-note { font-size: 13px; }
.fr-install-progress { list-style: none; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 12px 0 0; padding: 0; }
.fr-install-progress button { width: 100%; text-align: left; border-top: 3px solid var(--fr-line); padding: 16px 0; color: var(--vp-c-text-2); font-weight: 650; white-space: nowrap; }
.fr-install-progress button[aria-current] { border-color: var(--vp-c-brand-1); color: var(--fr-ink); }
.fr-install-progress span { display: block; font-size: 12px; font-variant-numeric: tabular-nums; }
.fr-install-task { border-bottom: 1px solid var(--fr-line); padding: 32px 0; min-height: 320px; }
.fr-install-instructions { list-style: decimal; padding-left: 24px; margin: 20px 0 28px; }
.fr-install-instructions li { padding-left: 6px; margin-bottom: 12px; }
a { color: var(--vp-c-brand-1); text-decoration: underline; text-underline-offset: 4px; }
.fr-install-primary, .fr-install-next { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: fit-content; max-width: 100%; border-radius: 6px; font-weight: 650; font-size: 15px; line-height: 1.4; text-decoration: none; padding: 14px 20px; margin: 20px 0; white-space: nowrap; }
.fr-install-primary { color: var(--fr-paper); background: var(--vp-c-brand-1); border: 1px solid var(--vp-c-brand-1); }
.fr-install-next { color: var(--fr-ink); border: 1px solid var(--fr-muted); background: var(--fr-paper); }
.fr-install-primary:hover { background: var(--vp-c-brand-2); }
.fr-install-next:hover { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.fr-install-primary:active, .fr-install-next:active { transform: translateY(1px); }
button, summary { cursor: pointer; }
.fr-install-text { display: block; color: var(--vp-c-brand-1); font-size: 14px; margin: 20px 0; text-decoration: underline; text-underline-offset: 4px; }
:is(a, button, summary, select):focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 4px; }
h2:focus { outline: none; }
.fr-install-help { padding: 24px 0; }
.fr-install-help summary { font-weight: 650; }
@media (max-width: 414px) { .fr-install-guide { padding: 36px 20px 48px; } .fr-install-primary, .fr-install-next { font-size: 13px; padding: 14px 12px; gap: 8px; } .fr-install-progress button { font-size: 13px; } }
</style>
