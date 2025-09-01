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
          value: `:::deck
:::slide
before outer layer
:::layer
before outer trigger
:::trigger{label="outer"}
:::set[outer=true]
:::

:::if[outer]
before inner layer
:::layer
:::trigger{label="inner one"}
:::set[inner=true]
:::

:::if[inner]
inner hit
:::
:::

:::trigger{label="inner two"}
:::set[inner2=true]
:::

:::if[inner2]
inner2 hit
:::
:::
:::
:::

:::layer
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

    expect(passageEl.textContent).not.toContain('inner hit')
    expect(passageEl.textContent).not.toContain('inner2 hit')

    const outerButton = await screen.findByRole('button', { name: 'outer' })
    act(() => {
      outerButton.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.outer).toBe(true)
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

    expect(passageEl.textContent).toContain('before outer layer')
    expect(passageEl.textContent).toContain('sibling layer after outer')
    expect(document.body.textContent).not.toContain(':::')
  })
})
