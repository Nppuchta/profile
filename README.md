# Portfolio

VFX Portfolio of Naomi Puchta

## Setup

```
git clone git@github.com:gpuchta/portfolio.git portfolio
cd portfolio
```

## Terminal Session

```
git config user.name "gpuchta"
git config user.email "gpuchta@gmail.com"

# clear so we don't end up trying using the company user
ssh-add -D

# now add private key that is registered with personal GitHub account
ssh-add ~/.ssh/id_rsa_github_gpuchta

ssh -T git@github.com
Hi gpuchta! You've successfully authenticated, but GitHub does not provide shell access.
```
