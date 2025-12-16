# Screens



### User

* user sign up
* user profiles (modify subscription)
* user's invitations to private matches
* user balance
* user match history
* reservation management
* match card
* list of public matches
* ranking



#### Admin

* list of sites
* site management
* statistics





# Classes



#### User

* id
* auth
* payment info
* basic info names, sex, age
* subscription
* ranked elo
* balance
* matches (reservations, history)



#### Match

* id
* date
* site, court
* type
* ranked
* players
* status
* winner
* balance



#### Match Status

* id
* status (draft?, created, paid, in progress, finished, cancelled)



#### Site

* id
* name
* colors
* closed days
* matches
* open hour
* close hour
* courts



#### Courts

* id
* number
* reservation
* site
