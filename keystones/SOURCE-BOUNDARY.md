# Generator boundary

`https://github.com/erikhinla/context-keystones` is named in the working document as the existing pack source. This credential received 404 for that repository, so its tree was not compared and nothing was pushed there.

The app that serves `https://transformby10x.ai/proof/screen` builds packs with `keystones/generator/generate.py` from this repository. The Dockerfile copies that directory into the image. The value-pack changes are in that copy, which is the generator this app runs. They are not a second, unrelated generator.

If `context-keystones` is later available, diff `products/context-keystones` against `keystones/generator` before treating either as the only maintained source.
