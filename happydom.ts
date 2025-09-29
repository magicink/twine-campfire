import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { afterAll, beforeAll } from 'bun:test'

const ensureRegistration = () => {
  if (!GlobalRegistrator.isRegistered) {
    GlobalRegistrator.register()
  }
}

ensureRegistration()

beforeAll(() => {
  ensureRegistration()
})

afterAll(async () => {
  if (GlobalRegistrator.isRegistered) {
    await GlobalRegistrator.unregister()
  }
})
