from argparse import ArgumentParser

from cfn_file_yaml import CloudformationFileYaml

parser = ArgumentParser()

parser.add_argument(
    "base",
    type=CloudformationFileYaml,
    help="The template to extend.",
)

parser.add_argument(
    "source",
    type=CloudformationFileYaml,
    help="The template to extend with.",
)

parser.add_argument(
    "target",
    type=str,
    help="The resulting template.",
)

args = parser.parse_args()
args.base.extend_with(args.source).save(args.target)
