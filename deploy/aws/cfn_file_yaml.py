from __future__ import annotations
from collections import OrderedDict

from awscli.customizations.cloudformation.yamlhelper import yaml_parse, yaml_dump


class CloudformationFileYaml(str):
    _contents: OrderedDict

    def __init__(self, path: str) -> None:
        try:
            with open(path, "r") as fp:
                self._contents = yaml_parse(fp.read())

                if not isinstance(self._contents, OrderedDict):
                    raise ValueError
        except Exception as error:
            raise TypeError(f'The "{path}" is an invalid Cloudformation YAML file.') from error

    def extends_with(self, another: CloudformationFileYaml) -> CloudformationFileYaml:
        if self is another:
            raise ValueError(f'Extending "{self}" with itself is not possible.')

        for key, value in self._contents.items():
            if isinstance(value, OrderedDict) and key in another._contents:
                if not isinstance(another._contents[key], OrderedDict):
                    raise ValueError(
                        (
                            f'The "{key}" is an object in "${self}" which '
                            f'obligates it to be an object in "${another}".'
                        ),
                    )

                self._contents[key] = {
                    **another._contents[key],
                    **value,
                }

        return self

    def save(self, path: str) -> Self:
        with open(path, "w") as fp:
            fp.write(yaml_dump(self._contents))

        return self


__all__ = [
    "CloudformationFileYaml",
]
