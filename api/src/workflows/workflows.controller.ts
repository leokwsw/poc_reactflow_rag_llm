import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateWorkflowDto, RunWorkflowDto, UpdateWorkflowDto } from './dto';
import { WorkflowsService } from './workflows.service';

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflows: WorkflowsService) {}

  @Post()
  create(@Body() dto: CreateWorkflowDto) {
    return this.workflows.create(dto);
  }

  @Get()
  list() {
    return this.workflows.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.workflows.get(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkflowDto) {
    return this.workflows.update(id, dto);
  }

  @Post(':id/run')
  run(@Param('id') id: string, @Body() dto: RunWorkflowDto) {
    return this.workflows.run(id, dto);
  }
}
