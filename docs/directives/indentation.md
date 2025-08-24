# Indentation

Directives preserve leading whitespace, so they can appear inside other
Markdown structures. You can use any amount of spaces or tabs—the parser
ignores the exact indentation:

```md
- Step one
  :set[visited=true]

> Quoted
> :goto["NEXT"]
```
