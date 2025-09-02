import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, act, waitFor } from '@testing-library/preact'
import type { Element } from 'hast'
import { Passage } from '@campfire/components/Passage/Passage'
import { useGameStore } from '@campfire/state/useGameStore'
import { useStoryDataStore } from '@campfire/state/useStoryDataStore'
import { resetStores } from '@campfire/test-utils/helpers'

beforeEach(async () => {
  resetStores()
  document.body.innerHTML = ''
  ;(HTMLElement.prototype as any).animate = () => ({
    finished: Promise.resolve()
  })
})

describe('nested if/set directives', () => {
  it('processes deeply nested directives with multiple siblings and triggers', async () => {
    const passage: Element = {
      type: 'element',
      tagName: 'tw-passagedata',
      properties: { pid: '1', name: 'Start' },
      children: [
        {
          type: 'text',
          value: `:::deck{size="800x600"}
:::slide
before outer layer
:::layer{x=40 y=40 className="flex flex-col gap-[8px]"}
before outer trigger
:::trigger{label="outer"}
::set[outer=true]
:::

:::if[outer]
before inner layer
:::layer{x=280 y=40 className="flex flex-col gap-[8px]"}
:::trigger{label="inner one"}
::set[inner=true]
:::

:::if[inner]
inner hit
:::trigger{label="inner off"}
::set[inner=false]
:::

:::trigger{label="inner two"}
::set[inner2=true]
:::

:::if[inner2]
inner2 hit
:::trigger{label="inner two off"}
::set[inner2=false]
:::
:::

:::trigger{label="outer off"}
::set[outer=false]
:::
:::

:::layer{x=40 y=240}
sibling layer after outer
:::
:::
:::slide
second slide
:::
:::`
        }
      ]
    }
    useStoryDataStore.setState({
      passages: [passage],
      currentPassageId: '1'
    })
    render(<Passage />)

    const passageEl = (await screen.findByTestId('passage')) as HTMLElement

    expect(passageEl.textContent).not.toContain('before inner layer')
    expect(passageEl.textContent).not.toContain('inner hit')
    expect(passageEl.textContent).not.toContain('inner2 hit')

    const outerButton = await screen.findByRole('button', { name: 'outer' })
    act(() => {
      outerButton.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.outer).toBe(true)
    })
    await waitFor(() => {
      expect(passageEl.textContent).toContain('before inner layer')
    })

    const innerOne = await screen.findByRole('button', { name: 'inner one' })
    act(() => {
      innerOne.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.inner).toBe(true)
    })
    await waitFor(() => {
      expect(passageEl.textContent).toContain('inner hit')
    })

    const innerOff = await screen.findByRole('button', { name: 'inner off' })
    act(() => {
      innerOff.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.inner).toBe(false)
    })
    await waitFor(() => {
      expect(passageEl.textContent).not.toContain('inner hit')
    })

    const innerTwo = await screen.findByRole('button', { name: 'inner two' })
    act(() => {
      innerTwo.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.inner2).toBe(true)
    })
    await waitFor(() => {
      expect(passageEl.textContent).toContain('inner2 hit')
    })

    const innerTwoOff = await screen.findByRole('button', {
      name: 'inner two off'
    })
    act(() => {
      innerTwoOff.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.inner2).toBe(false)
    })
    await waitFor(() => {
      expect(passageEl.textContent).not.toContain('inner2 hit')
    })

    const outerOff = await screen.findByRole('button', { name: 'outer off' })
    act(() => {
      outerOff.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.outer).toBe(false)
    })
    await waitFor(() => {
      expect(passageEl.textContent).not.toContain('before inner layer')
    })

    expect(passageEl.textContent).toContain('before outer layer')
    expect(passageEl.textContent).toContain('sibling layer after outer')
    expect(document.body.textContent).not.toContain(':::')
  })
})
