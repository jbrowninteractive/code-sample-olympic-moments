#!/bin/sh


# check for valid arguments
if [ "$1" != "staging" ] && [ "$1" != "production" ] ; then
	echo "ERROR: Invalid deployment target [staging | production]"
	exit
fi

# set gcloud project
gcloud config set project claro-timeline-production

# show current config
gcloud config list
echo "\n"

# create firewall rules on first deployment
# gcloud compute firewall-rules create default-allow-http-80 \
#     --allow tcp:80 \
#     --source-ranges 0.0.0.0/0 \
#     --target-tags http-server \
#     --description "Allow port 80 access to http-server"

# gcloud compute firewall-rules create default-allow-http-8080 \
#     --allow tcp:8080 \
#     --source-ranges 0.0.0.0/0 \
#     --target-tags http-server \
#     --description "Allow port 8080 access to http-server"

# gcloud compute firewall-rules create default-allow-https \
#     --allow tcp:443 \
#     --source-ranges 0.0.0.0/0 \
#     --target-tags http-server \
#     --description "Allow port 443 access to http-server"

# yaml file to use for deployment
YAML="app.yaml"

# give the instance version a name
VERSION="--version $1"

# immediately force traffic to new deployment
NOPROMOTE="--no-promote"

# set deployment verbosity
if [ "$2" == "-v" ] ; then
	VERBOSITY="--verbosity debug"
else
	VERBOSITY=""
fi

# capture contents of yaml file
ORIG_DATA=$(cat app.yaml)

# replace env token in yaml file
sed -i "" "s/<ENV_TOKEN>/$1/g" app.yaml

function remove
{
	if [ -f $1 ] ; then
		echo "remove $1"
		rm $1
	fi
}

function cleanup
{
	# write orig data to yaml file
	echo "$ORIG_DATA" > app.yaml

	# remove gcloud auto-gen files
	sleep 0.5
	remove "source-context.json"
	remove "source-contexts.json"
}

# cleanup files before exiting
trap cleanup EXIT

# run gcloud deployment
gcloud preview app deploy \
	$YAML \
	$VERSION \
	$VERBOSITY \
	# $NOPROMOTE

