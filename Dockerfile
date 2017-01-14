# Dockerfile extending the generic Node image with application files for a
# single application.
FROM gcr.io/google_appengine/nodejs

RUN apt-get -y update
RUN apt-get upgrade -y
RUN apt-get install -y git python python-cairo
RUN apt-get install -y build-essential python-dev libcairo2 libcairo2-dev python-setuptools sudo libjpeg-dev
RUN sudo easy_install pip
RUN sudo pip install --upgrade virtualenv
RUN sudo pip install --upgrade pillow


# Check to see if the the version included in the base runtime satisfies
# '>=6.0.0', if not then do an npm install of the latest available
# version that satisfies it.

RUN /usr/local/bin/install_node '>=6.0.0'
COPY . /app/
# You have to specify "--unsafe-perm" with npm install
# when running as root.  Failing to do this can cause
# install to appear to succeed even if a preinstall
# script fails, and may have other adverse consequences
# as well.
# This command will also cat the npm-debug.log file after the
# build, if it exists.
RUN npm install --unsafe-perm || \
  ((if [ -f npm-debug.log ]; then \
      cat npm-debug.log; \
    fi) && false)
RUN npm rebuild

CMD npm start
