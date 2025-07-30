import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { afterAll } from 'bun:test'

GlobalRegistrator.register()

afterAll(() => {
  GlobalRegistrator.unregister()
})
