import { type Command } from '../../../commands/command.interface';
import { type ClienteConPerfil } from '../repositories/clientes.repository';
import { type ClientesService } from '../services/clientes.service';

export class DesactivarClienteCommand implements Command<ClienteConPerfil> {
  private clienteDesactivadoId?: string;

  constructor(
    private readonly clientesService: ClientesService,
    private readonly clienteId: string,
    private readonly workspaceId: string,
  ) {}

  async execute(): Promise<ClienteConPerfil> {
    const cliente = await this.clientesService.softDelete(
      this.clienteId,
      this.workspaceId,
    );

    this.clienteDesactivadoId = cliente.id;

    return cliente;
  }

  async undo(): Promise<void> {
    if (!this.clienteDesactivadoId) {
      return;
    }

    await this.clientesService.restaurar(
      this.clienteDesactivadoId,
      this.workspaceId,
    );
  }

  descripcion(): string {
    return `Desactivar cliente ${this.clienteId} del workspace ${this.workspaceId}`;
  }
}
