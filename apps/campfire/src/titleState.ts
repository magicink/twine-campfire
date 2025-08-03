let overridden = false

export const markTitleOverridden = () => {
  overridden = true
}

export const clearTitleOverride = () => {
  overridden = false
}

export const isTitleOverridden = () => overridden
