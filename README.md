# configuration

See documentation [here](doc/00-overview.md)

``` yaml
use-extension:
  "@autorest/modelerfour": "~4.1.60"
  "cli.common": "$(this-folder)"

pipeline-model: v3

pipeline:
    cli.common:
        input: modelerfour
        output-artifact: source-file-common

    cli.common/emitter:
        input: cli.common
        scope: scope-here

scope-here:
    is-object: false
    output-artifact:
        - source-file-common
```
