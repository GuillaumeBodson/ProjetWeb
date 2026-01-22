## User stories

| role | condition | action | benefit |
|------|-----------|--------|---------|
| admin | | consult the details of a `site` | Recieve informations about a specific `site` |
| admin | | Edit properties of a `site` | Modify `site` properties to better align with the current situation |
| admin | | Consult the statistics | See information that help evaluate the `site` situation |
| admin | | navigate between statistics and details easily | have a clean screen and pleasnt navigation |
|      |           |        |         |
|      |           |        |         |
|      |           |        |         |
|      |           |        |         |
|      |           |        |         |

## Data

### `Site`

| Name | Type | nullable | editable |
|------|-----------|--------|---------|
| Id | int | x | x |
| Name | string | x | o |
| PrimaryColor | string | x |  o |
| SecondaryColor | string | x | o |
| OpeningHours | string | x |o|
| ClosingHours | string | x |o|
| ClosedDays | `Date`[] | x | o|
| Courts | `Court` [] | x | o        |
|      |           |        |         |
|      |           |        |         |
