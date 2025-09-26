import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'
import { DebugWindow } from '../DebugWindow'
import { TwPassagedata, TwStorydata } from '../TwineElements'

const meta: Meta = {
  title: 'Campfire/Directives/Localization'
}

export default meta

/**
 * Builds a language selector using localization directives.
 *
 * @returns Campfire story showcasing a language select menu.
 */
export const LanguageSelect: StoryObj = {
  render: () => (
    <>
      <TwStorydata startnode='1' options='debug'>
        <TwPassagedata pid='1' name='Start'>
          {`
::set[lang="en-US"]
::setLanguageLabel[en-US="English (US)"]
::setLanguageLabel[fr="Français"]
::setLanguageLabel[th="ไทย"]

::translations[en-US]{ui:greet="Hello"}
::translations[fr]{ui:greet="Bonjour"}
::translations[th]{ui:greet="สวัสดี"}

::set[languages=getLanguages()]

:::effect[watch=lang]
::lang[lang]
:::

:::select[lang]{label="Choose a language" data-testid="language-select"}
:::for[l in languages]
::option{value=l.code label=l.label}
:::
:::

:t[ui:greet]
          `}
        </TwPassagedata>
      </TwStorydata>
      <Campfire />
      <DebugWindow />
    </>
  )
}
