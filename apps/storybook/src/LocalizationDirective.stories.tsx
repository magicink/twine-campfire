import type { Meta, StoryObj } from '@storybook/preact'
import { Campfire } from '@campfire/components'

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
      <tw-storydata startnode='1' options='debug'>
        <tw-passagedata pid='1' name='Start'>
          {`
::set[lang="en-US"]
::setLanguageLabel[en-US="English (US)"]
::setLanguageLabel[fr="Français"]
::setLanguageLabel[th="ไทย"]

::translations[en-US]{ui:greet="Hello"}
::translations[fr]{ui:greet="Bonjour"}
::translations[th]{ui:greet="สวัสดี"}

::set[languages=getLanguages()]

::lang[lang]

:::select[lang]{label="Choose a language" data-testid="language-select"}
:::for[l in languages]
::option{value=l.code label=l.label}
:::
:::onChange
::lang[lang]
:::
:::

:t[ui:greet]
          `}
        </tw-passagedata>
      </tw-storydata>
      <Campfire />
    </>
  )
}
