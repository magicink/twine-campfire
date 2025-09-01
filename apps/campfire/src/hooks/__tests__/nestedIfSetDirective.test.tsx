import { describe, it, expect, beforeEach } from 'bun:test'
import { render, screen, act, waitFor } from '@testing-library/preact'
import { Campfire } from '@campfire/components'
import { useGameStore } from '@campfire/state/useGameStore'
import { resetStores } from '@campfire/test-utils/helpers'

beforeEach(() => {
  resetStores()
  document.body.innerHTML = ''
  ;(HTMLElement.prototype as any).animate = () => ({
    finished: Promise.resolve()
  })
})

describe('nested if/set directives', () => {
  it('processes deeply nested directives with multiple siblings and triggers', async () => {
    render(
      <>
        <tw-storydata startnode='1' options='debug'>
          <tw-passagedata pid='1' name='Start'>
            {`
:::deck
:::slide
before outer layer
:::layer
before outer trigger
:::trigger{label="outer"}
before outer set
:::set[outer=true]
:::
between outer set and if

:::if[outer]
before inner layer
:::layer
sibling before inner trigger one
:::trigger{label="inner one"}
before inner set
:::set[inner=true]
:::
between inner set and if

:::if[inner]
inner hit
:::
after inner if
:::
between inner triggers

:::trigger{label="inner two"}
before inner2 set
:::set[inner2=true]
:::
between inner2 set and if

:::if[inner2]
inner2 hit
:::
after inner2 if
:::
after inner triggers
:::
after inner layer
:::
after outer if
:::
after outer trigger
:::
after outer layer
:::layer
sibling layer after outer
:::
end slide
:::
:::slide
second slide
:::
:::
            `}
          </tw-passagedata>
        </tw-storydata>
        <Campfire />
      </>
    )

    const campfire = (await screen.findByTestId('campfire')) as HTMLElement

    expect(campfire.textContent).not.toContain('inner hit')
    expect(campfire.textContent).not.toContain('inner2 hit')

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
      expect(campfire.textContent).toContain('inner hit')
    })

    const innerTwo = await screen.findByRole('button', { name: 'inner two' })
    act(() => {
      innerTwo.click()
    })
    await waitFor(() => {
      expect(useGameStore.getState().gameData.inner2).toBe(true)
    })
    await waitFor(() => {
      expect(campfire.textContent).toContain('inner2 hit')
    })

    expect(campfire.textContent).toContain('after outer trigger')
    expect(campfire.textContent).toContain('after outer layer')
    expect(campfire.textContent).toContain('sibling layer after outer')
  })
})
