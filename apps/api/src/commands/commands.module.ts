import { Module } from '@nestjs/common';
import { CommandInvokerService } from './command-invoker.service';
import { CommandsController } from './commands.controller';

@Module({
  controllers: [CommandsController],
  providers: [CommandInvokerService],
  exports: [CommandInvokerService],
})
export class CommandsModule {}
