# Creating Packages

This guide walks you through creating a new package with lip.

## Using `lip init`

The easiest way to start a new project is using the `lip init` command.

```sh
lip init
```

This command will:
1.  Check for an existing `tooth.json` file.
2.  If none exists, it will create a basic `tooth.json` file in your current directory.

The generated `tooth.json` will look something like this:

```json
{
  "format_version": 3,
  "format_uuid": "289f771f-2c9a-4d73-9f3f-8492495a924d",
  "tooth": "github.com/user/repo",
  "version": "0.1.0",
  "variants": []
}
```

You should edit the `"tooth"` field to match your actual repository path or package identifier.

## Manual Creation

You can also create a `tooth.json` file manually. Ensure you include the required fields:

-   `format_version`: Currently `3`.
-   `format_uuid`: Must be `"289f771f-2c9a-4d73-9f3f-8492495a924d"`.
-   `tooth`: The unique identifier for your package.
-   `version`: A valid semantic version.

Example:

```json
{
  "format_version": 3,
  "format_uuid": "289f771f-2c9a-4d73-9f3f-8492495a924d",
  "tooth": "my-package",
  "version": "1.0.0",
  "info": {
    "description": "My awesome package"
  }
}
```

Once created, you can start adding dependencies using `lip install`.
