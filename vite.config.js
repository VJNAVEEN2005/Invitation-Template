export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss()],
    base: process.env.DEPLOY_TARGET === 'gh-pages' ? '/Invitation-Template/' : '/',
  }
})
