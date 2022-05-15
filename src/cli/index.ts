#!/usr/bin/env node

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { approve } from './approve'
import { discard } from './discard'

yargs(hideBin(process.argv)).command(approve).command(discard).demandCommand().parse()
