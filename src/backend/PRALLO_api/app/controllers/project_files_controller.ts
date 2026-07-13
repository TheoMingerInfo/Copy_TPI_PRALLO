import type { HttpContext } from '@adonisjs/core/http'
import { uploadBlob, downloadBlob, deleteBlob } from '#services/azure_storage'
import Project from '#models/project'
import ProjectFile from '#models/project_file'
import '#types/http_context'

const ALLOWED_TYPES = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif', 'zip', 'txt']

export default class ProjectFilesController {
  async store({ authUser, params, request, response, permissions }: HttpContext) {
    const user = authUser!
    const project = await Project.findOrFail(params.id)

    if (!permissions?.editAnyProject && project.professorId !== user.id) {
      return response.forbidden({ error: 'FORBIDDEN', message: 'Vous ne pouvez gérer que les fichiers de vos propres projets' })
    }

    const file = request.file('file', { size: '10mb', extnames: ALLOWED_TYPES })

    if (!file) {
      return response.badRequest({ error: 'MISSING_FILE', message: 'Aucun fichier fourni' })
    }
    if (!file.isValid) {
      return response.badRequest({ error: 'INVALID_FILE', message: file.errors[0]?.message ?? 'Fichier invalide' })
    }

    const blobName = `project-files/${project.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${file.extname}`
    const mimeType = `${file.type}/${file.subtype}`

    await uploadBlob(blobName, file.tmpPath!, mimeType, file.size)

    const projectFile = await ProjectFile.create({
      projectId: project.id,
      fileName: file.clientName!,
      filePath: blobName,
      fileSize: file.size,
      mimeType,
    })

    return response.created({
      id: projectFile.id,
      fileName: projectFile.fileName,
      fileSize: projectFile.fileSize,
      mimeType: projectFile.mimeType,
    })
  }

  async destroy({ authUser, params, response, permissions }: HttpContext) {
    const user = authUser!
    const project = await Project.findOrFail(params.id)

    if (!permissions?.editAnyProject && project.professorId !== user.id) {
      return response.forbidden({ error: 'FORBIDDEN', message: 'Vous ne pouvez gérer que les fichiers de vos propres projets' })
    }

    const projectFile = await ProjectFile.query()
      .where('id', params.fileId)
      .where('project_id', params.id)
      .firstOrFail()

    await deleteBlob(projectFile.filePath)
    await projectFile.delete()

    return response.ok({ message: 'Fichier supprimé' })
  }

  async download({ params, response }: HttpContext) {
    const projectFile = await ProjectFile.query()
      .where('id', params.fileId)
      .where('project_id', params.id)
      .firstOrFail()

    const stream = await downloadBlob(projectFile.filePath)

    response.header('Content-Disposition', `attachment; filename="${encodeURIComponent(projectFile.fileName)}"`)
    response.header('Content-Type', projectFile.mimeType)
    response.header('Content-Length', String(projectFile.fileSize))

    return response.stream(stream)
  }
}
